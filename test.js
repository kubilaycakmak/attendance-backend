import moment from 'moment';
import Reservation from './models/reservation.js';

// const detectConflictedTime = (d1, d2) => {
//   // if (d1.end >= d2.start && d2.start <= d1.end) return true
//   if (d1.end >= d2.start && d1.start <= d2.end) return true;
//   return false;
// };

// const d1 = {
//   date: {
//     start: "2022-09-08T12:00",
//     end: new Date(),
//   },
// };

// //
// const d2 = {
//   date: {
//     start: new Date("2022-09-08T13:00"),
//     end: new Date("2022-09-08T15:00"),
//   },
// };

// console.log(detectConflictedTime(d1.date, d2.date));

// const a = [[1, 56]].map((b) => {
//   return b.map((c) => {
//     return c * 2;
//   });
// });
// console.log(a);

// get next available time
const nextAvailableTime = async () => {
  const now = moment();

  const format = 'hh:mm';
  const startTime = moment('08:00', format);
  const endTime = moment('21:30', format);

  // TODO: get reservation as of now
  const room_id = '6335e24c64e8a6df4ed2223f';
  const reservations = await Reservation.find({ room_id });
  // const reservations = await Reservation.find({
  //   $and: [
  //     { room_id },
  //     // { end_date: { $gte: now.format('YYYY-MM-DD') } },
  //     // { end_time: { $gte: now.format(format) } },
  //   ],
  // });
  console.log(reservations);

  // const reservations = [
  //   {
  //     roomId: '6335e24c64e8a6df4ed2223f',
  //     type: 'weekly',
  //     startDate: '2022-10-05',
  //     endDate: '2022-10-07',
  //     startTime: '11:00',
  //     endTime: '12:30',
  //     duration: 12,
  //   },
  //   {
  //     roomId: '6335e24c64e8a6df4ed2223f',
  //     type: 'weekly',
  //     startDate: '2022-10-08',
  //     endDate: '2022-10-09',
  //     startTime: '15:00',
  //     endTime: '17:30',
  //     duration: 12,
  //   },
  //   {
  //     roomId: '6335e24c64e8a6df4ed2223f',
  //     type: 'weekly',
  //     startDate: '2022-10-07',
  //     endDate: '2022-10-010',
  //     startTime: '15:00',
  //     endTime: '17:30',
  //     duration: 12,
  //   },
  // ];

  //  sort closestReservation to get the newest reservation
  const sortedReservation = reservations.sort((r1, r2) => {
    return (
      moment([r1.endDate, r1.endTime].join('T')) -
      moment([r2.endDate, r2.endTime].join('T'))
    );
  });

  const closestReservation = sortedReservation[0];
  const closestStart = moment(
    [closestReservation.startDate, closestReservation.startTime].join('T')
  );
  const closestEnd = moment(
    [closestReservation.endDate, closestReservation.endTime].join('T')
  );

  let availableTime;
  if (now.isBefore(closestStart) && now.isBetween(startTime, endTime)) {
    availableTime = now;
  } else {
    availableTime = closestEnd;
  }

  return availableTime;
};

// nextAvailableTime();

// console.log(moment('2022-09-08T12:00').format('MMMM Do YYYY, h:mm:ss a'));
// console.log(new Date(nextAvailableTime()));

const now = moment();
const format = 'hh:mm';
const startTime = moment('08:00', format);
const endTime = moment('21:30', format);
const tomorrow = moment('08:00', format).add(1, 'days');

console.log(now);
console.log(now.isBetween(startTime, endTime));
console.log('tomorrow', tomorrow);
