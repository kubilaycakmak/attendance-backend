import mongoose from 'mongoose';
import moment from 'moment';
import Room from '../models/room.js';
import Reservation from '../models/reservation.js';

const validateReservation = async (reqData) => {
  const {
    room_id,
    type,
    start_date,
    end_date,
    start_time,
    end_time,
    duration,
  } = reqData;

  // type
  const validTypes = ['weekly', 'non_weekly'];
  if (!validTypes.includes(type)) {
    return {
      error: 'wrong type provided',
      statusCode: 400,
    };
  }
  // date
  if (Date.parse(start_date) > Date.parse(end_date)) {
    return {
      error: 'start date cannot be bigger than end date',
      statusCode: 400,
    };
  }
  // time
  if (start_time.replace(':', '') >= end_time.replace(':', '')) {
    return {
      error: 'start time cannot be bigger than or equal to end time',
      statusCode: 400,
    };
  }
  // room_id
  try {
    const room = await Room.findById(room_id);
    if (!room) {
      return {
        error: 'room with given ID does not exist',
        statusCode: 400,
      };
    }
  } catch (e) {
    return {
      error: 'invalid ID provided',
      statusCode: 400,
    };
  }
  // non_weekly reservation
  if (type === 'non_weekly') {
    // check for conflicts
    try {
      const existingReservations = await Reservation.find({ room_id });
      if (existingReservations.length) {
        const dateConflictedReservations = existingReservations.filter(
          (reservation) => {
            const endDateToUse =
              reservation.type === 'non_weekly'
                ? reservation.end_date
                : moment(reservation.end_date)
                    .add(reservation.duration - 1, 'weeks')
                    .format('YYYY-MM-DD');
            // check term conflict
            const isTermConflicted = !(
              end_date < reservation.start_date ||
              reservation.start_date > endDateToUse
            );
            if (!isTermConflicted) return false;

            // check day of week conflict
            const allFirstWeekExistingDates = getDatesBetween(
              reservation.start_date,
              reservation.end_date
            );
            const allRequestedDates = getDatesBetween(start_date, end_date);
            const allExistingDates = getDatesBetween(
              reservation.start_date,
              endDateToUse
            );
            // all days of week for each requested and existing dates
            const requestedDows = [
              ...new Set(
                allRequestedDates.map((date) => moment(date).format('dddd'))
              ),
            ];
            const existingDows = [
              ...new Set(
                allFirstWeekExistingDates.map((date) =>
                  moment(date).format('dddd')
                )
              ),
            ];

            // check if conflicted dates are included days of week for each requested and existing dates
            const truelyConflicted =
              allRequestedDates.find((requestedDate) => {
                if (allExistingDates.includes(requestedDate)) {
                  const dow = moment(requestedDate).format('dddd');
                  return (
                    requestedDows.includes(dow) && existingDows.includes(dow)
                  );
                }
                return false;
              }) != null;

            return truelyConflicted;
          }
        );
        const isConflicted =
          dateConflictedReservations.find((reservation) =>
            isTimeConflicted(
              start_time,
              end_time,
              reservation.start_time,
              reservation.end_time
            )
          ) != null;
        if (isConflicted) {
          return {
            error: 'reservation conflict found',
            statusCode: 400,
          };
        }
      }
    } catch (e) {
      console.log(e);
      return {
        error: 'unexpected error occured',
        statusCode: 500,
      };
    }

    // weekly reservation
  } else {
    // check if start_date and end_date are in the same week
    const startWeek = moment(start_date).week();
    const endWeek = moment(end_date).week();
    if (startWeek !== endWeek) {
      return {
        error: 'start_date and end_date need to be in the same week',
        statusCode: 400,
      };
    }

    // check duration value
    if (duration < 1) {
      return {
        error: 'wrong duration value provided. It needs to be at least 1',
        statusCode: 400,
      };
    }

    // check for weekend inclusion
    const startDateDow = moment(start_date).format('dddd');
    const endDateDow = moment(end_date).format('dddd');
    const weekends = ['Saturday', 'Sunday'];
    if (weekends.includes(startDateDow) || weekends.includes(endDateDow)) {
      return {
        error: 'weekends cannot be included',
        statusCode: 400,
      };
    }

    // check for conflicts
    try {
      const existingReservations = await Reservation.find({ room_id });
      if (existingReservations.length) {
        const dateConflictedReservations = existingReservations.filter(
          (reservation) => {
            const endDateToUse =
              reservation.type === 'non_weekly'
                ? moment(reservation.end_date).format('YYYY-MM-DD')
                : moment(reservation.end_date)
                    .add(reservation.duration - 1, 'weeks')
                    .format('YYYY-MM-DD');
            console.log(
              'reservation.end_date.format("YYYY-MM-DD")',
              moment('2022-10-11').format('YYYY-MM-DD')
            );
            console.log('reservation.end_date', '2022-10-11T00:00:00.000Z');

            // check term conflict
            const isTermConflicted = !(
              moment(end_date)
                .add(duration - 1, 'weeks')
                .format('YYYY-MM-DD') <
                moment(reservation.start_date).format('YYYY-MM-DD') ||
              moment(reservation.start_date).format('YYYY-MM-DD') > endDateToUse
            );
            if (!isTermConflicted) return false;

            // check day of week conflict
            const allFirstWeekRequestedDates = getDatesBetween(
              start_date,
              moment(end_date).format('YYYY-MM-DD')
            );
            const allFirstWeekExistingDates = getDatesBetween(
              reservation.start_date,
              moment(reservation.end_date).format('YYYY-MM-DD')
            );
            const allRequestedDates = getDatesBetween(
              start_date,
              moment(end_date)
                .add(duration - 1, 'weeks')
                .format('YYYY-MM-DD')
            );
            const allExistingDates = getDatesBetween(
              reservation.start_date,
              endDateToUse
            );
            // all days of week for each requested and existing dates
            const requestedDows = [
              ...new Set(
                allFirstWeekRequestedDates.map((date) =>
                  moment(date).format('dddd')
                )
              ),
            ];
            const existingDows = [
              ...new Set(
                allFirstWeekExistingDates.map((date) =>
                  moment(date).format('dddd')
                )
              ),
            ];

            // check if conflicted dates are included days of week for each requested and existing dates
            const truelyConflicted =
              allRequestedDates.find((requestedDate) => {
                if (allExistingDates.includes(requestedDate)) {
                  const dow = moment(requestedDate).format('dddd');
                  return (
                    requestedDows.includes(dow) && existingDows.includes(dow)
                  );
                }
                return false;
              }) != null;

            return truelyConflicted;
          }
        );
        const isConflicted =
          dateConflictedReservations.find((reservation) =>
            isTimeConflicted(
              start_time,
              end_time,
              reservation.start_time,
              reservation.end_time
            )
          ) != null;
        if (isConflicted) {
          return {
            error: 'reservation conflict found',
            statusCode: 400,
          };
        }
      }
    } catch (e) {
      console.log(e);
      return {
        error: 'unexpected error occured',
        statusCode: 500,
      };
    }
  }

  return {
    error: '',
    statusCode: 200,
  };
};

const isTimeConflicted = (
  startTimeToCompare,
  endTimeToCompare,
  startTimeToBeCompared,
  endTimeToBeCompared
) => {
  const startNum1 = startTimeToCompare.replace(':', '');
  const endNum1 = endTimeToCompare.replace(':', '');
  const startNum2 = startTimeToBeCompared.replace(':', '');
  const endNum2 = endTimeToBeCompared.replace(':', '');

  return (
    (startNum2 >= startNum1 && startNum2 < endNum1) ||
    (endNum1 >= endNum2 && startNum1 < endNum2)
  );
};

const getDatesBetween = (startDate, endDate) => {
  let now = moment(startDate).clone();
  let dates = [];

  while (now.isSameOrBefore(endDate)) {
    dates.push(now.format('YYYY-MM-DD'));
    now.add(1, 'days');
  }
  return dates;
};

// const isDateAndTimeConflicted = async ({
//   room_id,
//   start_date,
//   end_date,
//   start_time,
//   end_time,
//   duration,
// }) => {
//   try {
//     const existingReservations = await Reservation.find({
//       room_id: room_id,
//       $or: [
//         {
//           start_date: { $lte: start_date },
//           end_date: {
//             $gte: duration
//               ? moment(start_date).subtract(duration, 'weeks')
//               : start_date,
//           },
//         },
//         {
//           start_date: {
//             $lte: duration ? moment(end_date).add(duration, 'weeks') : end_date,
//           },
//           end_date: {
//             $gte: duration
//               ? moment(end_date).subtract(duration, 'weeks')
//               : end_date,
//           },
//         },
//       ],
//     });
//     console.log('existingReservations', existingReservations);
//     const isConflicted =
//       existingReservations.find((reservation) =>
//         isTimeConflicted(
//           start_time,
//           end_time,
//           reservation.start_time,
//           reservation.end_time
//         )
//       ) != null;

//     return isConflicted;
//   } catch (e) {
//     return {
//       error: 'unexpected error occured',
//       statusCode: 500,
//     };
//   }
// };

// const getAllDatesFromStart_date = (start_date, numberOfDays) => {
//   const dates = [];
//   for (let i = 0; i < numberOfDays + 1; i++) {
//     dates.push(moment(start_date).add(i, 'days'));
//   }
//   return dates;
// };

export { validateReservation };
