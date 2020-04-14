const getInfoFromNowStatus = (nowStatus) => {
  let status, live, img;

  switch(nowStatus) {
    case 'No popular times data':
      status = 0;
      live = false;
      break;
    case 'Usually not busy':
      status = 1;
      live = false;
      break;
    case 'Not busy':
    case 'Less busy than usual':
      status = 1;
      live = true;
      break;
    case 'Usually not too busy':
    case 'Usually a little busy':
      status = 2;
      live = false;
      break;
    case 'A little busy':
    case 'Not too busy':
    case 'Busier than usual':
      status = 2;
      live = true;
      break;
    case 'Usually as busy as it gets':
      status = 3;
      live = false;
      break;
    case 'Very busy':
    case 'As busy as it gets':
      status = 3;
      live = true;
      break;
  }
  
  switch(status) {
    case 0:
      img = '/marker_no_time_data.svg';
      break;
    case 1:
      img = '/marker_not_busy.svg';
      break;
    case 2:
      img = '/marker_not_too_busy.svg';
      break;
    case 3:
      img = '/marker_very_busy.svg';
      break;
  }

  return { status, live, img };
}

export default getInfoFromNowStatus;