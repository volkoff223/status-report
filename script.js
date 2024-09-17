// Sort and label files
const fileInput = document.getElementById("file-input");
const formCard = document.getElementById("form-card");
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
      case "HRSSA_Enrollment.csv":
        readFile(file, "Child Enrollment Information");
        break;
      default:
        alert("Could not scan " + file.name + ". Check the file name.");
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
      // dateRegex matches date formate
      let dateRegex = /^\d+-\d+-\d+/;
      if (dateRegex.test(value)) {
        return Date.parse(value);
      } else {
        return value;
      }
    },

    complete: function (rawData) {
      creatTableDiv(rawData, fileName);
    },
  });
};

const creatTableDiv = (rawData, fileName) => {
  const inspectionEl = document.getElementById("inspection-el");
  const staffDataEl = document.getElementById("staff-data-el");
  const studentDataEl = document.getElementById("student-data-el");
  const enrollmentEl = document.getElementById("enrollment-el");
  let dataRowsObj = {};
  switch (fileName) {
    case "Staff Data":
      dataRowsObj = cleanStaffData(rawData);
      break;
    case "Child Imunization Record":
      dataRowsObj = cleanStudentData(rawData);
      break;
    case "Inspections":
      dataRowsObj = cleanCenterData(rawData);
      break;
    case "Child Enrollment Information":
      dataRowsObj = cleanEnrollmentData(rawData);
      break;
  }
  let headersObj = createHeaders(dataRowsObj);
  const div = document.createElement("div");
  const h3 = document.createElement("h3");
  const tbl = document.createElement("table");
  const tblBody = document.createElement("tbody");
  const titleText = document.createTextNode(fileName);
  const headerRow = document.createElement("tr");

  // Append table headers to table
  for (const [key, value] of Object.entries(headersObj)) {
    const tblHeader = document.createElement("th");
    const tblHeaderText = document.createTextNode(value);
    tblHeader.appendChild(tblHeaderText);
    headerRow.appendChild(tblHeader);
  }
  tblBody.appendChild(headerRow);

  // Append table data to table
  for (i in dataRowsObj) {
    const today = Date.now();
    const oneMonth = 28 * 24 * 60 * 60 * 1000;
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const twoYears = 730 * 24 * 60 * 60 * 1000;
    const fiveYears = 1825 * 24 * 60 * 60 * 1000;
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const cellText = document.createTextNode(i);
    cell.appendChild(cellText);
    row.appendChild(cell);

    for (let [key, value] of Object.entries(dataRowsObj[i])) {
      const cell = document.createElement("td");
      //Add the correct amout of years to completion date to produce expiration date
      if ((key === "cpr" || key === "tbTest") && typeof value === "number") {
        value = value + twoYears;
      } else if (
        (key === "stateCheck" || key === "fbiCheck") &&
        typeof value === "number"
      ) {
        value = value + fiveYears;
      } else if (
        (key === "abuseNeglectCheck" || key === "preServiceUpdate") &&
        typeof value === "number"
      ) {
        value = value + oneYear;
      } else if (value === "") {
        value = "Missing";
      } else {
        value = value;
      }
      if (value < today) {
        value = "Expired";
        cell.style.color = "red";
      } else if (value === "Missing") {
        cell.style.color = "red";
      } else if (value < today + oneMonth) {
        value = new Date(value).toDateString();
        cell.style.color = "yellow";
      } else if (typeof value === "number") {
        value = new Date(value).toDateString();
      }
      const cellText = document.createTextNode(value);
      cell.appendChild(cellText);
      row.appendChild(cell);
    }

    tblBody.appendChild(row);
  }

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
    case "Child Enrollment Information":
      enrollmentEl.appendChild(div);
  }
};

const cleanStaffData = (rawData) => {
  let staffObj = {};
  let additionalCourses = [];
  const requiredStaffDocs = [
    "pre service 3 hour update",
    "pre service training",
    "cpr",
    "abuse prevention/reporting",
  ];
  for (let i = rawData.data.length - 1; i > 0; i--) {
    let data = rawData.data[i];
    // Ignore all inactive employees
    if (data["User Status"] === "Active") {
      // Create an array of additional couses
      courseName = data["Course Name"]?.toLowerCase();
      if (requiredStaffDocs.includes(courseName)) {
        switch (courseName) {
          case "pre service 3 hour update":
            courseName = "preServiceUpdate";
            break;
          case "pre service training":
            courseName = "preServiceTraining";
            break;
          case "cpr":
            courseName = "cpr";
            break;
          case "abuse prevention/reporting":
            courseName = "abusePreventionReporting";
            break;
          default:
            break;
        }
        additionalCourses.push({
          fullName: data["Staff Name"],
          completionDate: data["Training Completion Date"],
          courseName: courseName,
        });
      }
      let fullName = data["Staff Name"];
      // Initialize staff object
      staffObj[fullName] = {
        abusePreventionReporting: "",
        cpr: "",
        preServiceUpdate: "",
        preServiceTraining: "",
      };
      for (key in data) {
        switch (key) {
          //! These dates are completion dates and need to have the proper amount of years added to them to make them the correct expiration date
          case "TB Test Completion":
            staffObj[fullName].tbTest = data[key];
            break;
          case "State Background Check Complete":
            staffObj[fullName].stateCheck = data[key];
            break;
          case "FBI Check Complete":
            staffObj[fullName].fbiCheck = data[key];
            break;
          case "Child Abuse/Neglect Records Check Comp":
            staffObj[fullName].abuseNeglectCheck = data[key];
        }
      }
    }
  }

  // Add additional courses as properties to employee
  for (i in staffObj) {
    for (j in additionalCourses) {
      if (additionalCourses[j].fullName === i) {
        let cName = additionalCourses[j].courseName;
        if (
          (cName === "preServiceTraining" ||
            cName === "abusePreventionReporting") &&
          additionalCourses[j].completionDate !== ""
        ) {
          staffObj[i][cName] = "Completed";
        } else {
          staffObj[i][cName] = additionalCourses[j].completionDate;
        }
      }
    }
  }
  return staffObj;
};

const cleanStudentData = (dataRows) => {
  let data = dataRows.data;
  let studentObj = {};
  for (let i = data.length - 1; i >= 0; i--) {
    if (
      data[i]["Child Status"] !== "Active" ||
      data[i]["Alert"] !== "Overdue"
    ) {
      data.splice(i, 1);
    }
  }
  let newArray = [];
  let uniqueObject = {};
  for (let i = data.length - 1; i >= 0; i--) {
    staffName = data[i]["Child Full Name"];
    uniqueObject[staffName] = data[i];
  }
  for (i in uniqueObject) {
    newArray.push(uniqueObject[i]);
  }
  for (let i = 0; i < data.length; i++) {
    studentObj[data[i]["Child Full Name"]] = { Alert: data[i]["Alert"] };
  }

  return studentObj;
};

const cleanCenterData = (dataRows) => {
  const data = dataRows.data;
  let centerObj = {};
  document.getElementById("center-name-el").innerText =
    data[0]["Provider Name"];
  document.getElementById("center-license-exp-el").innerHTML =
    "License Expiration Date" +
    "<br />" +
    new Date(data[0]["License Expiration Date"]).toDateString();
  for (let i = 0; i < data.length; i++) {
    centerObj[data[i]["Inspection Type"]] = {
      "Date Inspection Expires": data[i]["Date Inspection Expires"],
      "Inspection Result": data[i]["Inspection Result"],
    };
  }
  return centerObj;
};

const cleanEnrollmentData = (dataRows) => {
  const today = Date.now();
  const oneMonth = 28 * 24 * 60 * 60 * 1000;
  let data = dataRows.data;
  let enrollmentObj = {};
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i]["Child Status"] !== "Active") {
      data.splice(i, 1);
    }
  }
  let uniqueObject = {};
  for (let i = data.length - 1; i >= 0; i--) {
    studentName = data[i]["Child Full Name"];
    uniqueObject[studentName] = data[i];
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i]["Child Notes"] === "") {
      data[i]["Child Notes"] = "None";
    }
    if (
      data[i]["Child Notes"] !== "None" ||
      data[i]["Medical Evaluation Expiration"] < today + oneMonth ||
      data[i]["Medical Evaluation Expiration"] === ""
    ) {
      enrollmentObj[data[i]["Child Full Name"]] = {
        medicalEvaluation: data[i]["Medical Evaluation Expiration"],

        childNotes: data[i]["Child Notes"],
      };
    }
  }
  return enrollmentObj;
};

const createHeaders = (dataRowsObj) => {
  let headersObj = { fullName: "Name" };
  for (i in dataRowsObj) {
    for (const [key, value] of Object.entries(dataRowsObj[i])) {
      switch (key) {
        case "fullName":
          headersObj[key] = "Name";
          break;
        case "tbTest":
          headersObj[key] = "TB Test";
          break;
        case "fbiCheck":
          headersObj[key] = "FBI Background Check";
          break;
        case "stateCheck":
          headersObj[key] = "State Background Check";
          break;
        case "cpr":
          headersObj[key] = "CPR";
          break;
        case "abuseNeglectCheck":
          headersObj[key] = "Sworn Statement";
          break;
        case "abusePreventionReporting":
          headersObj[key] = "Abuse Prevention Reporting";
          break;
        case "preServiceTraining":
          headersObj[key] = "Pre-Service Training";
          break;
        case "preServiceUpdate":
          headersObj[key] = "Pre-Service Update";
          break;
        case "medicalEvaluation":
          headersObj[key] = "Medical Evaluation";
          break;
        case "childNotes":
          headersObj[key] = "Child Notes";
          break;

        default:
          headersObj[key] = key;
          break;
      }
    }
  }
  return headersObj;
};

// Reload page
document.getElementById("reload-page-btn").addEventListener("click", () => {
  window.location.reload();
  fileInput.value = "";
});
