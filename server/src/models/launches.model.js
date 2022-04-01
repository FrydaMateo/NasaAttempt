const launches = require('./launches.mongo');
const planets = require('./planets.mongo');
const axios = require('axios');

const launch = {
    flightNumber: 100,
    mission:'Kepler Exploration X',
    rocket : 'Explorer IS1',
    launchDate: new Date('December 27, 2030'),
    target: 'Kepler-442 b',
    customers: ['ZTM', 'NASA'],
    upcoming: true,
    success: true,
};

const defaultFlightNumber = 100;
const SPACE_X_API_URL = "https://api.spacexdata.com/v4/launches/query";

saveLaunch(launch);

async function loadLaunchData(){
    console.log('Downloading launch data...');
    const response = await axios.post(SPACE_X_API_URL, {
        query: {},
        options: {
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        'customers': 1
                    }
                }
            ]
        }
    });

    const launchDocs = response.data.docs;

    for (const launchDoc of launchDocs){
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['success'],
            customers
        }

        console.log(`${launch.flightNumber} ${launch.mission}`);
    }
}


async function existsLaunchWithId(launchId) {
    return await launches.findOne({
        flightNumber: launchId
    });
}

async function abortLaunchById(launchId) {
    const aborted = await launches.updateOne({
        flightNumber: launchId
    }, {
        upcoming: false,
        success:false,
    });

    return aborted.acknowledged && aborted.modifiedCount === 1;
}

async function getAllLaunches() {
    return await launches
        .find({}, {'_id': 0, '__v': 0});
}

async function saveLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if(!planet) {
        throw new Error('No matching planet found');
    }

    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true
    });
}

async function addNewLaunch(launch) {
    const newFlightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,
        customers: ['Zero To Mastery', 'Nasa'],
        upcoming: true,
        success: true,
    });
    await saveLaunch(launch);
}

async function getLatestFlightNumber() {
        const latestLaunch = await launches
            .findOne()
            .sort('-flightNumber');

        if (!latestLaunch)
            return defaultFlightNumber;
        return latestLaunch.flightNumber;

}

module.exports = {
    existsLaunchWithId,
    getAllLaunches,
    addNewLaunch,
    abortLaunchById,
    loadLaunchData,
}