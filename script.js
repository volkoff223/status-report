const fileInput = document.getElementById("file-input");
const fileInputFieldset = document.getElementById("file-fieldset");

let staffData = [];

// Array of columns to remove
const columnRemoveArray = [
  "User Status",
  "Provider Name",
  "Phone",
  "E-Mail Address",
  "Staff Title",
  "Primary Room",
  "Date of Birth",
  "Termination Date",
  "Date Hired",
  "Course Name",
  "Training Completion Date",
  "Training Expiration Date",
  "File Attached",
  "Other Special Duties",
];

// Sort and label files
fileInput.addEventListener("change", (event) => {
  Array.from(event.target.files).forEach((file) => {
    switch (file.name) {
      case "HRSSA_Provider_Data.csv":
        readFile(file, "Licensing & Inspections");
        break;
      case "HRSSA_Staff_Data.csv":
        readFile(file, "Staff Data");
        break;
      case "HRSSA_Child_licensing_Immunization.csv":
        readFile(file, "Child Imunization Record");
      default:
        console.log("Skiped", file.name);
        break;
    }
  });
});

// Parse file and return array of objects
const readFile = (file, fileName) => {
  Papa.parse(file, {
    header: true,
    dynamicTypting: true,
    complete: function (results) {
      creatDiv(results, fileName);
    },
  });
};

const creatDiv = (dataObject, fileName) => {
  const headers = dataObject.meta.fields;
  let dataRows = dataObject.data;
  if (fileName === "Staff Data") {
    cleanStaffData(dataRows);
    dataRows = staffData;
  }
  const div = document.createElement("div");
  const h3 = document.createElement("h3");
  const tbl = document.createElement("table");
  const tblBody = document.createElement("tbody");
  const titleText = document.createTextNode(fileName);
  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    if (!columnRemoveArray.includes(header)) {
      const tblHeader = document.createElement("th");
      const tblHeaderText = document.createTextNode(header);
      tblHeader.appendChild(tblHeaderText);
      headerRow.appendChild(tblHeader);
    }
  });
  tblBody.appendChild(headerRow);

  dataRows.forEach((dataRow) => {
    const row = document.createElement("tr");

    for (const [key, value] of Object.entries(dataRow)) {
      if (!columnRemoveArray.includes(`${key}`)) {
        const cell = document.createElement("td");
        const cellText = document.createTextNode(`${value}`);
        cell.appendChild(cellText);
        row.appendChild(cell);
      }
    }

    tblBody.appendChild(row);
  });
  tbl.appendChild(tblBody);
  h3.appendChild(titleText);
  div.appendChild(h3);
  div.appendChild(tbl);
  const end = document.getElementById("output");
  document.body.appendChild(div);
};

// Remove inactive and duplicate staff in staff file
const cleanStaffData = (dataRows) => {
  for (let i = dataRows.length - 1; i > 0; i--) {
    if (dataRows[i]["User Status"] === "Inactive") {
      dataRows.splice(i, 1);
    }
  }
  let newArray = [];
  let uniqueObject = {};
  for (let i = dataRows.length - 1; i > 0; i--) {
    staffName = dataRows[i]["Staff Name"];
    uniqueObject[staffName] = dataRows[i];
  }
  for (i in uniqueObject) {
    newArray.push(uniqueObject[i]);
  }
  staffData = newArray;
};
