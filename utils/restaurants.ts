import { Restaurant } from "@prisma/client";

export function isRestaurantOpen(restaurant: Restaurant): boolean {
  const currentDateTime = new Date();
  const day = currentDateTime.getUTCDay();
  const time =
    currentDateTime.getUTCHours() * 60 +
    currentDateTime.getUTCMinutes() +
    day * 3600;

  let openingTime: Date | undefined;
  let closingTime: Date | undefined;
  let prevClosingTime: Date | undefined;
  let prevOpeningTime: Date | undefined;

  switch (day) {
    case 0:
      openingTime = restaurant.openingTimeSun;
      closingTime = restaurant.closingTimeSun;
      prevClosingTime = restaurant.closingTimeSat;
      prevOpeningTime = restaurant.openingTimeSat;
      break;
    case 1:
      openingTime = restaurant.openingTimeMon;
      closingTime = restaurant.closingTimeMon;
      prevClosingTime = restaurant.closingTimeSun;
      prevOpeningTime = restaurant.openingTimeSun;
      break;
    case 2:
      openingTime = restaurant.openingTimeTue;
      closingTime = restaurant.closingTimeTue;
      prevClosingTime = restaurant.closingTimeMon;
      prevOpeningTime = restaurant.openingTimeMon;
      break;
    case 3:
      openingTime = restaurant.openingTimeWen;
      closingTime = restaurant.closingTimeWen;
      prevClosingTime = restaurant.closingTimeTue;
      prevOpeningTime = restaurant.openingTimeTue;
      break;
    case 4:
      openingTime = restaurant.openingTimeThu;
      closingTime = restaurant.closingTimeThu;
      prevClosingTime = restaurant.closingTimeWen;
      prevOpeningTime = restaurant.openingTimeWen;
      break;
    case 5:
      openingTime = restaurant.openingTimeFri;
      closingTime = restaurant.closingTimeFri;
      prevClosingTime = restaurant.closingTimeThu;
      prevOpeningTime = restaurant.openingTimeThu;
      break;
    case 6:
      openingTime = restaurant.openingTimeSat;
      closingTime = restaurant.closingTimeSat;
      prevClosingTime = restaurant.closingTimeFri;
      prevOpeningTime = restaurant.openingTimeFri;
      break;
  }

  if (!openingTime || !closingTime || !prevClosingTime || !prevOpeningTime) {
    return false;
  }

  const openingTimeMin =
    new Date(openingTime).getUTCHours() * 60 +
    new Date(openingTime).getUTCMinutes() +
    day * 3600;
  let closingTimeMin =
    new Date(closingTime).getUTCHours() * 60 +
    new Date(closingTime).getUTCMinutes() +
    day * 3600;

  // Get Previous Day Closing Hours
  const prevOpeningTimeMin =
    new Date(prevOpeningTime).getUTCHours() * 60 +
    new Date(prevOpeningTime).getUTCMinutes();
  const prevClosingTimeMin =
    new Date(prevClosingTime).getUTCHours() * 60 +
    new Date(prevClosingTime).getUTCMinutes();

  // closing time is the next day, add 3600 minutes to closing time
  if (closingTimeMin < openingTimeMin) {
    closingTimeMin += 3600;
  }

  const checkPrev = prevClosingTimeMin < prevOpeningTimeMin;

  // Normal hours or Check previous hours
  return (
    (time >= openingTimeMin && time <= closingTimeMin) ||
    (checkPrev && time <= prevClosingTimeMin + day * 3600)
  );
}
