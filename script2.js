// todo All dates are off by a couple of days. Need to find a better way to calculate expiration date
// todo Date issue is probably due to UTC vs. local time

// todo Check with Jen about the length of time before each thing expires

const fileInput = document.getElementById("file-input");
const fileInputFieldset = document.getElementById("file-fieldset");
const reloadButton = document.getElementById("reload-page-btn");
const formCard = document.getElementById("form-card");
const centerNameEl = document.getElementById("center-name-el");
const centerLicenseExpirationEl = document.getElementById(
  "center-license-exp-el"
);
const inspectionEl = document.getElementById("inspection-el");
const staffDataEl = document.getElementById("staff-data-el");
const studentDataEl = document.getElementById("student-data-el");

let staffData = [];
let studentData = [];

reloadButton.addEventListener("click", () => {
  window.location.reload();
  fileInput.value = "";
});

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
  "Medical Evaluation Expiration",
  "Date of Inspection",
  "Additional Courses",
  "License Expiration Date",
];

let requiredStaffDocs = [
  "pre service 3 hour update",
  "pre service training",
  "cpr",
  "abuse prevention/reporting",
];

// Sort and label files
fileInput.addEventListener("change", (event) => {
  // Remove form card and add center name to title
  formCard.style.display = "none";
  Array.from(event.target.files).forEach((file) => {
    switch (file.name) {
      case "HRSSA_Provider_Data.csv":
        readFile(file, "Inspections");
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
    dynamicTyping: false,
    skipEmptyLines: true,
    transform: function (value) {
      let numberRegex = /^\d+-\d+-\d+/;
      if (!value) {
        return "Missing";
      } else if (numberRegex.test(value)) {
        return Date.parse(value);
      } else {
        return value;
      }
    },

    complete: function (results) {
      creatDiv(results, fileName);
    },
  });
};

const creatDiv = (dataObject, fileName) => {
  let headers = dataObject.meta.fields;
  let dataRows = dataObject.data;

  switch (fileName) {
    case "Staff Data":
      cleanStaffData(dataRows);
      dataRows = staffData;
      break;
    case "Child Imunization Record":
      cleanStudentData(dataRows);
      dataRows = studentData;
      break;
    case "Inspections":
      cleanCenterData(dataRows);
      break;
  }

  const div = document.createElement("div");
  const h3 = document.createElement("h3");
  const tbl = document.createElement("table");
  const tblBody = document.createElement("tbody");
  const titleText = document.createTextNode(fileName);
  const headerRow = document.createElement("tr");
  // Add aditional training documents to staff data headers
  if (fileName === "Staff Data") {
    headers = [
      ...headers,
      "abuse prevention/reporting",
      "cpr",
      "pre service 3 hour update",
      "pre service training ",
    ];
  }
  headers.forEach((header) => {
    if (!columnRemoveArray.includes(header)) {
      const tblHeader = document.createElement("th");
      // Remove the word "complete" from the staff data headers
      if (fileName === "Staff Data") {
        let reg = header.split(" ");
        let rev = header.split(" ").reverse();
        if (
          rev[0] === "Complete" ||
          rev[0] === "Comp" ||
          rev[0] === "Completion"
        ) {
          reg.pop();
        }
        header = reg.join(" ");
        const tblHeaderText = document.createTextNode(header);
        tblHeader.appendChild(tblHeaderText);
      } else {
        const tblHeaderText = document.createTextNode(header);
        tblHeader.appendChild(tblHeaderText);
      }
      headerRow.appendChild(tblHeader);
    }
  });
  tblBody.appendChild(headerRow);

  dataRows.forEach((dataRow) => {
    const row = document.createElement("tr");

    for (const [key, value] of Object.entries(dataRow)) {
      if (!columnRemoveArray.includes(key)) {
        const cell = document.createElement("td");
        if (!isNaN(value)) {
          const today = new Date();

          if (value < today) {
            const cellText = document.createTextNode("Expired");
            cell.style.color = "red";
            cell.appendChild(cellText);
          } else if (value - today < 2419200000) {
            const cellText = document.createTextNode(
              new Date(value).toDateString()
            );
            cell.style.color = "yellow";
            cell.appendChild(cellText);
          } else {
            const cellText = document.createTextNode(
              new Date(value).toDateString()
            );
            cell.style.color = "rgb(40, 244, 40)";
            cell.appendChild(cellText);
          }
        } else if (value === "Missing") {
          const cellText = document.createTextNode(value);
          cell.style.color = "red";
          cell.appendChild(cellText);
        } else {
          const cellText = document.createTextNode(value);
          cell.appendChild(cellText);
        }
        row.appendChild(cell);
      }
    }

    tblBody.appendChild(row);
  });
  tbl.appendChild(tblBody);
  h3.appendChild(titleText);
  div.appendChild(h3);
  div.appendChild(tbl);
  switch (fileName) {
    case "Staff Data":
      staffDataEl.appendChild(div);
      break;
    case "Child Imunization Record":
      studentDataEl.appendChild(div);
      break;
    case "Inspections":
      inspectionEl.appendChild(div);
      break;
  }
};

// Remove inactive and duplicate staff in staff file
const cleanStaffData = (dataRows) => {
  for (let i = dataRows.length - 1; i > 0; i--) {
    if (dataRows[i]["User Status"] === "Inactive") {
      dataRows.splice(i, 1);
    }
  }
  // Make array of additional courses for each staff member
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

  // Remove duplicate staff members
  let newArray = [];
  let uniqueObject = {};
  for (let i = dataRows.length - 1; i >= 0; i--) {
    staffName = dataRows[i]["Staff Name"];
    uniqueObject[staffName] = dataRows[i];
  }
  for (i in uniqueObject) {
    newArray.push(uniqueObject[i]);
  }
  // Add additional courses as individual properties to each unique staff member
  for (let i = 0; i < newArray.length; i++) {
    // Initialize "additional course properties"
    newArray[i]["abuse prevention/reporting"] = "Missing";
    newArray[i]["cpr"] = "Missing";
    newArray[i]["pre service 3 hour update"] = "Missing";
    newArray[i]["pre service training"] = "Missing";
    // Set expiration date
    if (!isNaN(newArray[i]["TB Test Completion"])) {
      newArray[i]["TB Test Completion"] += 86400000 * 730;
    }
    if (!isNaN(newArray[i]["State Background Check Complete"])) {
      newArray[i]["State Background Check Complete"] += 86400000 * 1095;
    }
    if (!isNaN(newArray[i]["FBI Check Complete"])) {
      newArray[i]["FBI Check Complete"] += 86400000 * 1095;
    }
    if (!isNaN(newArray[i]["Child Abuse/Neglect Records Check Comp"])) {
      newArray[i]["Child Abuse/Neglect Records Check Comp"] += 86400000 * 365;
    }
    for (let j = 0; j < additionalCourses.length; j++) {
      if (additionalCourses[j]["Staff Name"] === newArray[i]["Staff Name"]) {
        const cName = additionalCourses[j]["Course Name"];
        if (cName === "abuse prevention/reporting") {
          const cDate = additionalCourses[j]["Training Completion Date"];
          newArray[i][cName] = cDate + 86400000 * 730;
        }
        if (cName === "cpr") {
          const cDate = additionalCourses[j]["Training Completion Date"];
          newArray[i][cName] = cDate + 86400000 * 730;
        }
        if (cName === "pre service 3 hour update") {
          const cDate = additionalCourses[j]["Training Completion Date"];
          newArray[i][cName] = cDate + 86400000 * 730;
        }
        if (cName === "pre service training") {
          const cDate = additionalCourses[j]["Training Completion Date"];
          newArray[i][cName] = cDate + 86400000 * 730;
        }
      }
    }
  }
  staffData = newArray;
};

const cleanStudentData = (dataRows) => {
  for (let i = dataRows.length - 1; i >= 0; i--) {
    if (
      dataRows[i]["Child Status"] !== "Active" ||
      dataRows[i]["Alert"] !== "Overdue"
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

const cleanCenterData = (dataRows) => {
  centerNameEl.innerText = dataRows[0]["Provider Name"];
  centerLicenseExpirationEl.innerHTML =
    "License Expiration Date" +
    "<br />" +
    new Date(dataRows[0]["License Expiration Date"]).toDateString();
  for (let i = 0; i < dataRows.length; i++) {
    dataRows[i]["Date of Inspection"] = new Date(
      dataRows[i]["Date of Inspection"]
    ).toDateString();
    dataRows[i]["Date Inspection Expires"] = new Date(
      dataRows[i]["Date Inspection Expires"]
    ).toDateString();
  }
};
