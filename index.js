const express = require('express');
const axios = require('axios');
const geolib = require('geolib');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

let numUsers = 0;

const placeSearch = (location) => {
  return new Promise(async (resolve, reject) => {
    let status;

    try {
      const placeSearchResponse = await axios(`https://www.google.com/search?tbm=map&tch=1&q=${encodeURIComponent(location.address)}`);

      const jsonBody = JSON.parse(placeSearchResponse.data.replace('/*""*/', '')).d.replace(")]}'", '');

      status = JSON.parse(jsonBody)[0][1][0][14][84][6];

      if (status.indexOf('Now: ') === -1 && status !== 'No popular times data') {
        location.live = true;
      }

      status = status.replace('Now: ', '');
    } catch (err) {
      status = 'No popular times data';
    }

    location.status = status;

    resolve(location);
  });
}

// Serve static files from the React app
app.use(express.static(path.join('client/build')));

app.get('/api/health', (req, res) => {
  res.send('Healthy');
});

app.get('/api/locations', async (req, res) => {
  const category = req.query.category;
  const latitude = req.query.latitude;
  const longitude = req.query.longitude;
  const zoom = 15;

  const categorySearchResponse = await axios(`https://www.google.com/maps/search/${category}/@${latitude},${longitude},${zoom}z/data=!3m1!4b1`);
  let htmlBody = categorySearchResponse.data;

  if (htmlBody.indexOf('Cold Storage Bugis Junction') !== -1) {
    console.log(htmlBody.substring(htmlBody.indexOf('Cold Storage Bugis Junction') - 100, htmlBody.indexOf('Cold Storage Bugis Junction') + 100));
  }

  // const categoryToken = `\\\",null,[\\\"${category}\\\"`;
  const categoryToken = `\\\",null,[\\\"`;

  const promises = [];

  while (htmlBody.indexOf(categoryToken) !== -1) {
    // to find name
    const firstIndex = htmlBody.indexOf(categoryToken);
    const secondIndex = htmlBody.lastIndexOf('"', firstIndex);

    // to find address
    const thirdIndex = htmlBody.indexOf('null,null,null,', firstIndex);
    const fourthIndex = htmlBody.indexOf('\\\",', thirdIndex);

    // to find lat, long
    const fifthIndex = htmlBody.lastIndexOf('[', firstIndex);
    const sixthIndex = htmlBody.lastIndexOf(']', firstIndex);
    const coordinates = htmlBody.substring(fifthIndex + 1, sixthIndex).split(',');

    const name = htmlBody.substring(secondIndex + 1, firstIndex);
    const address = htmlBody.substring(thirdIndex + 17, fourthIndex);
    let distanceRaw = geolib.getDistance(
      { latitude, longitude },
      { latitude: coordinates[2], longitude: coordinates[3] }
    );

    let distance;
    if (distanceRaw >= 1000) {
      distance = `${(distanceRaw / 1000).toFixed(1)} km`;
    } else {
      distance = `${distanceRaw} m`;
    }

    const live = false;

    promises.push(placeSearch({ name, address, distance, distanceRaw, live }));

    htmlBody = htmlBody.replace(categoryToken, '');

    // replace again to remove contact number (TODO: improve this hardcoded part)
    if (htmlBody.substring(htmlBody.indexOf(categoryToken) + 11, htmlBody.indexOf(categoryToken) + 15) === 'tel:') {
      htmlBody = htmlBody.replace(categoryToken, '');
    }
  }

  let locations = await Promise.all(promises);

  res.send({ locations });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join('/client/build/index.html'));
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Crowdy app listening on port ${port}!`));

io.on('connection', function (socket) {
  numUsers++;

  io.emit('numUsers', {
    numUsers
  });

  socket.on("disconnect", () => {
    numUsers--;

    io.emit('numUsers', {
      numUsers
    });
  });
});