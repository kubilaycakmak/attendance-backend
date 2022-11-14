import moment from 'moment';
import Reservation from '../models/reservation.js';

const getNextAvailableTime = async (room_id) => {
  const now = moment();
  const format = 'hh:mm';
  const schoolStart = moment('08:00', format);
  const schoolEnd = moment('21:30', format);

  const reservations = await Reservation.find({
    $and: [
      { room_id },
      { actual_end_date: { $gte: now.format('YYYY-MM-DD') } },
      { status: { $ne: 'Canceled' } },
    ],
  });

  if (!reservations.length) {
    return now.format('YYYY-MM-DD HH:mm');
  }
  const nonWeeklyReservations = reservations.filter(
    ({ type }) => type === 'non_weekly'
  );
  const weeklyReservations = reservations.filter(
    ({ type }) => type === 'weekly'
  );

  const clonedWeeklyReservations = [];
  weeklyReservations.forEach((weeklyReservation) => {
    let duration = weeklyReservation.duration - 1;

    clonedWeeklyReservations.push(weeklyReservation._doc);
    while (duration) {
      const tmp = {
        ...weeklyReservation._doc,
        start_date: moment(weeklyReservation.start_date)
          .add(duration, 'weeks')
          .format('YYYY-MM-DD'),
        end_date: moment(weeklyReservation.end_date)
          .add(duration, 'weeks')
          .format('YYYY-MM-DD'),
      };
      clonedWeeklyReservations.push(tmp);
      duration--;
    }
  });

  const actualReservations = [
    ...nonWeeklyReservations,
    ...clonedWeeklyReservations,
  ].filter(({ end_date }) => moment(end_date).isSameOrAfter(now, 'days'));

  //  sort closestReservation to get the newest reservation
  const sortedReservation = actualReservations.sort((r1, r2) => {
    return (
      moment([r1.end_date, r1.end_time].join('T')) -
      moment([r2.end_date, r2.end_time].join('T'))
    );
  });

  const closestReservation = sortedReservation[0];

  const cloneClosestReservation = [];
  const s = moment(closestReservation.start_date);
  const e = moment(closestReservation.end_date);
  let dayDiff = e.diff(s, 'days');

  cloneClosestReservation.push(closestReservation);
  while (dayDiff) {
    const tmp = {
      ...closestReservation,
      start_date: moment(closestReservation.start_date)
        .add(dayDiff, 'days')
        .format('YYYY-MM-DD'),
      end_date: moment(closestReservation.start_date)
        .add(dayDiff, 'days')
        .format('YYYY-MM-DD'),
    };
    cloneClosestReservation.push(tmp);
    dayDiff--;
  }
  const actualClosestReservation = cloneClosestReservation
    .filter(({ start_date }) => moment(start_date).isSameOrAfter(now, 'days'))
    .sort((r1, r2) => {
      return moment(r1.start_date) - moment(r2.start_date);
    })[0];

  const closestStart = moment(
    [
      actualClosestReservation.start_date,
      actualClosestReservation.start_time,
    ].join('T')
  );
  const closestEnd = moment(
    [
      actualClosestReservation.start_date,
      actualClosestReservation.end_time,
    ].join('T')
  );

  let availableTime;

  if (
    now.isBefore(moment(closestStart).subtract(30, 'minutes')) &&
    now.isBetween(schoolStart, schoolEnd)
  ) {
    availableTime = now;
  } else if (
    (now.isBefore(closestStart) &&
      !now.isBetween(schoolStart, schoolEnd) &&
      moment('08:00', format).add(1, 'days').isBefore(closestStart)) ||
    (now.isBetween(closestStart, closestEnd) &&
      closestEnd.isAfter(moment(schoolEnd).subtract(30, 'minutes')))
  ) {
    availableTime = moment('08:00', format).add(1, 'days');
  } else {
    availableTime = closestEnd;
  }

  return availableTime.format('YYYY-MM-DD hh:mm A');
};

export default getNextAvailableTime;
