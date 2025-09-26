// server.js
const http = require("http");
const url = require("url");
const fs = require("fs");
const crypto = require("crypto");
var mysql = require("mysql2/promise");
var formidable = require("formidable");

// database connect
var pool = mysql.createPool({

  host: "localhost",
  user: "root",
  password: "",
   database: "maxconsultancy",
 
});

let sessionId2 = "";
const client = 2;
const admin = 1;
const adminname = "admin";
const vendor = 3;
const vendorname = "vendor";
var idDatas = "";

const today = new Date();

// Get the year, month, and day components of the date
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
const day = String(today.getDate()).padStart(2, "0");
const day2 = String(today.getDate() + 14).padStart(2, "0");

// Format the date as YYYY-MM-DD
const formattedDate = `${year}-${month}-${day}`;
const formattedDate2 = `${year}-${month}-${day2}`;

const expirationTime = new Date(formattedDate2);
console.log(expirationTime);
console.log(new Date("2011-04-11T10:20:30Z"));
console.log("expirationTime............");

//start of node server
const server = http.createServer(async (req, res) => {

    //get the url
    var q = url.parse(req.url, true);
  
    //gets the pathname
    var pathname = "." + q.pathname;
  
  // the base of url
    var host1 = "http://localhost:8080";
  
    // session object for receiveing cookie data
    let session = {
      sessionId: "",
      alerted: "",
      data: {
        id: "",
        username: "",
        fullname: "",
        role_id: "",
        rolename: "",
      },
    };
  
    //extracting cookie data
    const cookies = parseCookies(req);
    session.sessionId = cookies["sessionId"];
    session.data.username = cookies["sessionu"];
    session.data.fullname = cookies["sessionf"];
    session.data.id = cookies["sessioni"];
    session.data.role_id = cookies["sessionri"] ;
    session.data.rolename = cookies["sessionrn"] ? cookies["sessionrn"].split(';')[0] : cookies["sessionrn"] ;
    var alertedid = cookies["alertedid"];
    var alertedvalue = cookies["alertedvalue"];
  

  ///////GET GET GET METHODS

  if (req.method === "GET") {
    session;
    var productslists = "";
    let datas = "";
    let AllvendorCount = 0;
    let AllClientCount = 0;
    let AllProductCount = 0;
    let AllvendorCountToday = 0;
    let AllClientCountToday = 0;
    let AllProductCountToday = 0;
    let datas200 = "";
    let datas300 = "";
    let datascentral = "";
    let navbar1 = "";
    let notifcoounter = 0;


 // Method for landing page: Serve the HTML registration form(Babatunde)
 if (pathname === "./" || pathname === `./index.html`) {
    fs.readFile("./views/index.html", "utf8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  }
  // Method for logout page(Babatunde)
  if (pathname === "./logout") {
    fs.readFile("./views/index.html", "utf8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        session.data.username = null;
        session.data.fullname = null;
        session.data.id = null;
  
        session.data.role_id = null;
        session.data.rolename = null;
  
        res.setHeader("Set-Cookie", `session= ;Path=/;Max-Age=0 ; HttpOnly`);
        res.writeHead(302, {
          "Content-Type": "text/html",
          Location: host1 + `/index.html`,
        });
        res.end();
      }
    });
  }
 // Check if the request path is equal to the login page
 if (pathname === "./login.html") {
    // Read the login page file
    fs.readFile("./views/login.html", "utf8", async (err, data) => {
      // If there is an error, return a 500 error
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // Get all roles from the database
        const [rows, fields] = await pool.execute("SELECT * FROM role");
  
        // Create an HTML string to display the role options
        datas += '<option value="">--select type of user type--</option>';
        // You can also iterate over the results and access individual rows
  
        for (let result of rows) {
          datas += `<option value="${result.id}">${result.name}</option>`;
        }
  
        // Replace the login option placeholder with the actual data
        datas = data
          .replace(/\{\{loginOption\}\}/g, datas)
          .replace(/\{\{alerted\}\}/g, session.alerted);
  
        // Return the login page with the updated data
        res.writeHead(200, { "Content-Type": "text/html" });
  
        res.write(datas);
        res.end();
      }
    });
  }
  

  if (pathname === "./register.html") {
    fs.readFile('./views/register.html', "utf8", async (err, data) => {
      try {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
  
          const [rows, fields] = await pool.execute("SELECT * FROM country");
  //building some html dynamic session
          datas += '<option value="">--select country--</option>';
          // You can also iterate over the results and access individual rows
          for (let result of rows) {
            datas += `<option value="${result.id}_${result.name}">${result.name}</option>`;
          }
  
          var fetchedQuery = q.query; 
          data = data
            .replace(/\{\{countryoption\}\}/g, datas)
            .replace(/\{\{email\}\}/g, fetchedQuery.email)
            .replace(/\{\{password\}\}/g, fetchedQuery.password);
  
          res.write(data);
          res.end();
        }
      } catch (error) {
        console.error("Error executing query:", error);
      }
    });
  }
        //////////////////////////////////////////POST POST POST METHODS
  } else if (req.method === "POST") {
    var sql = "";
    var newpathpdf = "";
    var newpathimg = "";
    var filer = {};
    var fielder = {};
    var fieldername = "";
    var values = [];
    var base64String = ""; 
    var base64Stringpdf = null;
  
  }
  ///ASSET ASSETS ASSETS ASSETS
  {
    if (
      req.url.endsWith(".JPG") ||
      req.url.endsWith(".jpg") ||
      req.url.endsWith(".jpeg") ||
      req.url.endsWith(".png") ||
      req.url.endsWith(".svg")
    ) {
      // Read the image file
      if (
        req.url.endsWith(".jpeg") ||
        req.url.endsWith(".jpg") ||
        req.url.endsWith(".JPG")
      ) {
        fs.readFile(pathname, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Image not found");
          } else {
            // Set Content-Type header to indicate image/jpeg
            res.writeHead(200, { "Content-Type": "image/jpg" });
            // Send the image data as the response
            res.end(data);
          }
        });
      }
      if (req.url.endsWith(".png")) {
        fs.readFile(pathname, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Image not found");
          } else {
            // Set Content-Type header to indicate image/jpeg
            res.writeHead(200, { "Content-Type": "image/png" });
            // Send the image data as the response
            res.end(data);
          }
        });
      }
      if (req.url.endsWith(".svg")) {
        fs.readFile(pathname, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Image not found");
          } else {
            // Set Content-Type header to indicate image/jpeg
            res.writeHead(200, { "Content-Type": "image/svg+xml" });
            // Send the image data as the response
            res.end(data);
          }
        });
      }
    }

    if (req.url.endsWith(".css")) {
      // Read the CSS file
      fs.readFile(pathname, "utf8", (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        } else {
          // Set Content-Type header
          res.writeHead(200, { "Content-Type": "text/css" });
          // Send the CSS content
          res.end(data);
        }
      });
    }

    if (req.url.endsWith(".js")) {
      // Read the CSS file
      fs.readFile(pathname, "utf8", (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        } else {
          // Set Content-Type header
          res.writeHead(200, { "Content-Type": "text/javascript" });
          // Send the CSS content
          res.end(data);
        }
      });
    }
  }


});


// Function to parse cookies from the request header 
// This function parses the cookies from the request object
function parseCookies(req) {
  // Get the cookie header from the request
  const cookieHeader = req.headers.cookie;
 
  // Create an empty object to store the cookies
  const cookies = {};
  // Check if the cookie header exists
  if (cookieHeader) {
    // Log a message to the console
    console.log("cookieHeader....in......");
    // Split the cookie header by the ! character
    cookieHeader.split("!").forEach((cookie) => {
      // Split the cookie by the # character
      const parts = cookie.split("#");
      // Store the cookie name and value in the cookies object
      cookies[parts[0].trim()] = parts[1].trim();
    });
  }
  // Return the cookies object
  return cookies;
}


const port = 8080;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
