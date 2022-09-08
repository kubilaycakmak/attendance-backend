const detectConflictedTime = (d1, d2) => {
    if (d1.end >= d2.start && d2.start <= d1.end) return true
    return false

}


const d1 = {
    date: {
        start: new Date("2022-09-08T12:00"),
        end: new Date("2022-09-08T12:30")
    }
}

const d2 = {
    date: {
        start: new Date("2022-09-08T11:00"),
        end: new Date("2022-09-08T15:00")
    }
}


console.log(detectConflictedTime(d1.date,d2.date))