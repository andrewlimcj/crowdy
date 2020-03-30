const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

const placeSearch = (location) => {
  return new Promise(async (resolve, reject) => {
    let status = 'No popular times data';
    try {
      const placeSearchResponse = await axios(`https://www.google.com/search?tbm=map&tch=1&q=${location.address}`);

      const jsonBody = JSON.parse(placeSearchResponse.data.replace('/*""*/', '')).d.replace(")]}'", '');
      status = JSON.parse(jsonBody)[0][1][0][14][84][6];
    } catch (err) {
      status = 'No popular times data';
    }

    if (status.indexOf('Now: ') === -1 && status !== 'No popular times data') {
      location.live = true;
    }

    status = status.replace('Now: ', '');

    location.status = status;

    resolve(location);
  });
}

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

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

  const categoryToken = `\\\",null,[\\\"${category}\\\"`;

  const promises = [];

  while (htmlBody.indexOf(categoryToken) !== -1) {
    const firstIndex = htmlBody.indexOf(categoryToken);
    const secondIndex = htmlBody.lastIndexOf('"', firstIndex);
    const thirdIndex = htmlBody.indexOf('null,null,null,', firstIndex);
    const fourthIndex = htmlBody.indexOf('\\\",', thirdIndex);

    const name = htmlBody.substring(secondIndex + 1, firstIndex);
    const address = htmlBody.substring(thirdIndex + 17, fourthIndex);
    const live = false;
    console.log(name);
    console.log(address);
    promises.push(placeSearch({ name, address, live }));

    htmlBody = htmlBody.replace(categoryToken, '');
  }

  const locations = await Promise.all(promises);
  
  res.send({ locations });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Crowdy app listening on port ${port}!`));