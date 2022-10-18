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
      { end_date: { $gte: now.format('YYYY-MM-DD') } },
      { end_time: { $gte: now.format(format) } },
    ],
  });
  if (!reservations.length) {
    return now.format('YYYY-MM-DD HH:mm');
  }

  //  sort closestReservation to get the newest reservation
  const sortedReservation = reservations.sort((r1, r2) => {
    return (
      moment([r2.end_date, r2.end_time].join('T')) -
      moment([r1.end_date, r1.end_time].join('T'))
    );
  });

  const closestReservation = sortedReservation[0];
  console.log(closestReservation);
  const closestStart = moment(
    [closestReservation.start_date, closestReservation.start_time].join('T')
  );
  const closestEnd = moment(
    [closestReservation.end_date, closestReservation.end_time].join('T')
  );

  let availableTime;

  if (now.isBefore(closestStart) && now.isBetween(schoolStart, schoolEnd)) {
    availableTime = now;
  } else if (
    now.isBefore(closestStart) &&
    !now.isBetween(schoolStart, schoolEnd) &&
    moment('08:00', format).add(1, 'days').isBefore(closestStart)
  ) {
    availableTime = moment('08:00', format).add(1, 'days');
  } else {
    availableTime = closestEnd;
  }

  return availableTime.format('YYYY-MM-DD HH:mm');
};

export default getNextAvailableTime;
