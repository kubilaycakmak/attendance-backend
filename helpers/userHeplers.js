import Appointment from '../models/appointment.js';
import moment from 'moment';

const getSchedules = (id) => {
    // find all appointments
    const appointments = await Appointment.find({ created_by: id }); // [{date: 1663109366731 }]
    const availabilityStart = 9;
    const availabilityEnd = 17;
    const monthsDates = [];

    for (let m = 0; m <= 2; m++) {
      const month = parseInt(moment(new Date()).add(m, 'M').format('M'));
      const monthEnd = parseInt(moment(month).endOf('month').format('DD'));
      const tmpArray = [];

      for (let d = 1; d <= monthEnd; d++) {
        tmpArray.push({ month: month, date: d, options: [] });
      }
      monthsDates.push(tmpArray);
    }

    const options = []; // [9, 10, 11, ...]
    for (let i = availabilityStart; i < availabilityEnd; i++) {
      options.push({
        time: moment(i, ['HH']).format('h:mm A'),
        isAvailable: false,
      });
    }
    
    return monthsDates.map((month) => {
      return month.map((dateObj) => {
        const individualOptions = [...options];

        //1月1日のappoitment全部取ってくる
        const appintmentsForTheDay = appointments.filter((appointment) => {
          return (
            new Date(appointment.date).getMonth() + 1 === dateObj,
            month && new Date(appointment.date).getDate() === dateObj.date
          );
        });

        console.log('appintmentsFortheDay', appintmentsForTheDay);
        // extract hours from date timestamp - Ex) [1, 4, ... 12、,4,4]
        const startHours = appintmentsForTheDay.map((appointment) =>
          moment(new Date(appointment.date).getHours(), ['HH']).format('h:mm A')
        );
        console.log('startHours', startHours);

        // exclude time options that are already booked
        const excludedIndividualOptions = individualOptions.map((option) => {
          return {
            ...option,
            isAvailable: !startHours.includes(option.time),
          };
        });

        return {
          ...dateObj,
          options: [...excludedIndividualOptions],
        };
      });
    });
}

export { getSchedules };
