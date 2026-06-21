const { getDataset } = require("./services/datasetService");

const data = getDataset("DBMS");

console.log(data);