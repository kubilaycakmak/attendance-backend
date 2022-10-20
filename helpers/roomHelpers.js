import moment from 'moment';
import Room from '../models/room.js';
import Reservation from '../models/reservation.js';
import { MAX_WEEK_DURATION } from '../config/reservationConfig.js';

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
      error: 'Wrong type provided. Only "weekly" or "non_weekly" are accepted.',
      statusCode: 400,
    };
  }
  // date
  if (Date.parse(start_date) > Date.parse(end_date)) {
    return {
      error: 'Start date cannot be bigger than end date',
      statusCode: 400,
    };
  }
  // time
  if (start_time.replace(':', '') >= end_time.replace(':', '')) {
    return {
      error: 'Start time cannot be bigger than or equal to end time',
      statusCode: 400,
    };
  }
  // room_id
  try {
    const room = await Room.findById(room_id);
    if (!room) {
      return {
        error: 'Room with given ID does not exist',
        statusCode: 400,
      };
    }
  } catch (e) {
    return {
      error: 'Invalid ID format provided',
      statusCode: 400,
    };
  }

  if (type === 'weekly') {
    // check if start_date and end_date are in the same week
    const startWeek = moment(start_date).week();
    const endWeek = moment(end_date).week();
    if (startWeek !== endWeek) {
      return {
        error:
          'Start_date and end_date need to be in the same week for a "weekly" reservation',
        statusCode: 400,
      };
    }

    // check duration value
    if (duration < 1) {
      return {
        error:
          'Wrong duration value provided. It needs to be bigger than or equal to 1',
        statusCode: 400,
      };
    }
    if (duration > MAX_WEEK_DURATION) {
      return {
        error: `The maximum duration acceptable is ${MAX_WEEK_DURATION}.`,
        statusCode: 400,
      };
    }

    // check for weekend inclusion
    const startDateDow = moment(start_date).format('dddd');
    const endDateDow = moment(end_date).format('dddd');
    const weekends = ['Saturday', 'Sunday'];
    if (weekends.includes(startDateDow) || weekends.includes(endDateDow)) {
      return {
        error: 'Weekends cannot be included',
        statusCode: 400,
      };
    }
  }

  // check for conflicts
  try {
    const existingReservations = await Reservation.find({
      room_id,
      status: { $ne: 'Canceled' },
    });
    if (existingReservations.length) {
      const dateConflictedReservations = existingReservations.filter(
        (reservation) => {
          const requestEndDateToUse =
            type === 'non_weekly'
              ? moment(end_date).format('YYYY-MM-DD')
              : moment(end_date)
                  .add(duration - 1, 'weeks')
                  .format('YYYY-MM-DD');
          const existingEndDateToUse =
            reservation.type === 'non_weekly'
              ? moment(reservation.end_date).format('YYYY-MM-DD')
              : moment(reservation.end_date)
                  .add(reservation.duration - 1, 'weeks')
                  .format('YYYY-MM-DD');

          // check term conflict
          const isTermConflicted = !(
            requestEndDateToUse <
              moment(reservation.start_date).format('YYYY-MM-DD') ||
            moment(reservation.start_date).format('YYYY-MM-DD') >
              existingEndDateToUse
          );
          if (!isTermConflicted) return false;

          // check day of week conflict
          const allFirstWeekRequestedDates = getDatesBetween(
            moment(start_date).format('YYYY-MM-DD'),
            moment(end_date).format('YYYY-MM-DD')
          );
          const allFirstWeekExistingDates = getDatesBetween(
            moment(reservation.start_date).format('YYYY-MM-DD'),
            moment(reservation.end_date).format('YYYY-MM-DD')
          );
          const allRequestedDates = getDatesBetween(
            moment(start_date).format('YYYY-MM-DD'),
            requestEndDateToUse
          );
          const allExistingDates = getDatesBetween(
            moment(reservation.start_date).format('YYYY-MM-DD'),
            existingEndDateToUse
          );
          // all days of week for each requested and existing dates
          const baseDatesToRetrieveDowFrom =
            type === 'non_weekly'
              ? allRequestedDates
              : allFirstWeekRequestedDates;
          const requestedDows = [
            ...new Set(
              baseDatesToRetrieveDowFrom.map((date) =>
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
          error: 'Reservation conflict found with provided date',
          statusCode: 400,
        };
      }
    }
  } catch (e) {
    console.log(e);
    return {
      error: 'Unexpected error occured. Please try again.',
      statusCode: 500,
    };
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

export { validateReservation };
