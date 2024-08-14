const fileInput = document.getElementById("file-input");
const fileInputFieldset = document.getElementById("file-fieldset");

let staffData = [];
let studentData = [];

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
  "Exemption Expiration Date",
  "Child Status",
];

let requiredStaffDocs = [
  "pre service 3 hour update",
  "pre service training",
  "cpr",
  "abuse prevention/reporting",
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
      case "HRSSA_Child_Licensing_Immunization.csv":
        readFile(file, "Child Imunization Record");
        break;
      default:
        //alert("Could not scan " + file.name + ". Check the file name.");
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
  let headers = dataObject.meta.fields;
  let dataRows = dataObject.data;
  if (fileName === "Staff Data") {
    cleanStaffData(dataRows);
    dataRows = staffData;
  }
  if (fileName === "Child Imunization Record") {
    cleanStudentData(dataRows);
    dataRows = studentData;
  }

  const div = document.createElement("div");
  const h3 = document.createElement("h3");
  const tbl = document.createElement("table");
  const tblBody = document.createElement("tbody");
  const titleText = document.createTextNode(fileName);
  const headerRow = document.createElement("tr");
  // Add aditional training documents to staff data headers
  if (fileName === "Staff Data") {
    headers = [...headers, "Additional Courses"];
  }
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

    //todo need to add value of data row to it's corrisponding key column
    for (const [key, value] of Object.entries(dataRow)) {
      if (!columnRemoveArray.includes(key)) {
        const cell = document.createElement("td");
        const cellText = document.createTextNode(value);
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
  // Match courseName to array of regex
  let additionalCourses = [];
  for (let i = 0; i < dataRows.length; i++) {
    courseName = dataRows[i]["Course Name"]?.toLowerCase();
    if (requiredStaffDocs.includes(courseName)) {
      // Create array of objects with staff name and all aditional courses (Will contain duplicates)
      additionalCourses.push({
        "Staff Name": dataRows[i]["Staff Name"],
        "Course Name": courseName,
        "Training Completion Date": dataRows[i]["Training Completion Date"],
      });
    }
  }

  let newArray = [];
  let uniqueObject = {};
  for (let i = dataRows.length - 1; i >= 0; i--) {
    staffName = dataRows[i]["Staff Name"];
    uniqueObject[staffName] = dataRows[i];
  }
  for (i in uniqueObject) {
    newArray.push(uniqueObject[i]);
  }
  // Add additional courses to each unique staff member
  for (let i = 0; i < newArray.length; i++) {
    newArray[i]["Additional Courses"] = [];
    for (let j = 0; j < additionalCourses.length; j++) {
      if (additionalCourses[j]["Staff Name"] === newArray[i]["Staff Name"]) {
        const cName = additionalCourses[j]["Course Name"];
        const cDate = additionalCourses[j]["Training Completion Date"];
        // This adds key/value pairs of course name and date to each employee
        //todo This will only work if all additional course names are exatly the same
        //newArray[i][cName] = cDate;
        // This add a new array to the employee object for all additional courses they have completed
        newArray[i]["Additional Courses"].push(cName + " " + cDate);
      }
    }
  }
  console.log(newArray);
  staffData = newArray;
};

const cleanStudentData = (dataRows) => {
  for (let i = dataRows.length - 1; i >= 0; i--) {
    if (
      dataRows[i]["Child Status"] !== "Active" ||
      dataRows[i]["Alert"] === ""
    ) {
      dataRows.splice(i, 1);
    }
  }
  let newArray = [];
  let uniqueObject = {};
  for (let i = dataRows.length - 1; i >= 0; i--) {
    staffName = dataRows[i]["Child Full Name"];
    uniqueObject[staffName] = dataRows[i];
  }
  for (i in uniqueObject) {
    newArray.push(uniqueObject[i]);
  }
  studentData = newArray;
};
