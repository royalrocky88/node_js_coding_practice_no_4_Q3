//------------SQL Initializing-------------------------------------
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//-------------Object State---------------------------
const convertStateDBObjResponseDBObj = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//-------------Object for District--------------------
const convertDistrictDBObjResponseDBObj = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//---Get --read all state in table-------------------
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT * FROM state;
    `;

  const stateArray = await db.all(getStateQuery);
  response.send(
    stateArray.map((eachState) => convertStateDBObjResponseDBObj(eachState))
  );
});

//---Get --Read specific state by state_id------------
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};
    `;

  const state = await db.get(getStateQuery);
  response.send(convertStateDBObjResponseDBObj(state));
});

//---Post --Create New District in district table------
app.post("/districts/", async (request, response) => {
  const districtDetail = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetail;

  const addDistrictDetail = `
    INSERT INTO district (district_name, state_id,cases, cured, active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
    );
    `;

  const dbResponse = await db.run(addDistrictDetail);

  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//---Get -- Find specific district by district_id------
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId};
    `;

  const district = await db.get(getDistrictQuery);

  response.send(convertDistrictDBObjResponseDBObj(district));
});

//---Delete -- Remove District detail by district_id-----
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictDetail = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;

  await db.run(deleteDistrictDetail);
  response.send("District Removed");
});

//---Put --Modify district detail by district_id-------
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  //const districtDetail = request.body;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
    UPDATE district 
    SET district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//---Get -- Total covid in All State----------------
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getTotalStateStats = `
  SELECT 
    SUM(cases) As totalCases,
    SUM(cured) As totalCured,
    SUM(active) As totalActive,
    SUM(deaths) As totalDeaths
  FROM
  district WHERE state_id = ${stateId};
  `;

  const statsArray = await db.get(getTotalStateStats);

  response.send(
    //       {
    //     totalCases: stats["SUM(cases)"],
    //     totalCured: stats["SUM(cured)"],
    //     totalActive: stats["SUM(active)"],
    //     totalDeaths: stats["SUM(deaths)"],
    //   }
    statsArray
  );
});

//---Get --Specific district_id details find-----------
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictDetail = `
    SELECT state_name
    FROM state
    NATURAL JOIN district
    WHERE district_id = ${districtId};
    `;

  const districtName = await db.get(getDistrictDetail);

  response.send({
    stateName: districtName.state_name,
  });
});

module.exports = app;
