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


function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

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

  //building notification html tag
  if (alertedvalue) {
    if (alertedid === "0") {
      //for error message
      session.alerted = `<div class="" style="background-color:orange; padding: 10px; border-radius: 20px;">
    <div class="colnotifc" style="text-align: center;font-weight: bold;" >
       Error Message:
    </div>
    
     <div>
       ${alertedvalue}
       
     </div>
    </div>`;
    } else {
      //for success message
      session.alerted = `<div class="" style="background-color: green; padding: 10px; border-radius: 20px;">
    <div class="colnotifc" style="text-align: center;font-weight: bold;color=white" >
       Success Message:
    </div>
    
     <div>
       ${alertedvalue}
      
     </div>
    </div>`;
    }
  }


  // if username null, then generate a new session ID
  if (!session.data.username) {
    sessionId2 = generateSessionId();
  }

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

   
 //for navigation 
if (session.data.username) {
  //reads the HTML file
  fs.readFile("./views/navbar.html", "utf8", async (err, navbar) => {
    //checks file error
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error for navbar");
    } else {

      if (session.data.rolename === adminname) {

        
        //building some html dynamic session
        datas += ` <li><a href="./viewproductlist.html?qty=all">Manage Products</a></li>  <li><a href="./viewvendorlist.html?qty=all">Manage Vendors </a></li>  <li><a href="./viewclientlist.html?qty=all">Manage Clients</a></li> <li><a href="./profile.html?id=${session.data.id}">Profile</a></li>`;

        navbar1 = navbar
          .replace(/\{\{adminsidebar\}\}/g, datas)
          .replace(/\{\{username\}\}/g, session.data.username)
          .replace(/\{\{clientsidebar\}\}/g, "").replace(/\{\{notifcount\}\}/g, notifcoounter)
          .replace(/\{\{vendorsidebar\}\}/g, "");
      } else {
      
        //building some html dynamic session
        datas += ` <li><a href="./viewproductlist.html?qty=all">Manage Products</a></li>    <li><a href="./vendorprofile.html?id=${session.data.id}">Profile</a></li>`;

        navbar1 = navbar
          .replace(/\{\{vendorsidebar\}\}/g, datas)
          .replace(/\{\{username\}\}/g, session.data.username)
          .replace(/\{\{clientsidebar\}\}/g, "").replace(/\{\{notifcount\}\}/g, notifcoounter)
          .replace(/\{\{adminsidebar\}\}/g, "");
      }
      // <li><a href="./viewfavoriteclientlist.html">My clients</a></li>
    }
  });
}
// Serve the HTML view product list
 if (pathname === "./viewproductlist.html") {
  let rowgotten = [];
  let addproductbutton = " ";
  let deleteButton = " ";
  fs.readFile('./views/viewproductlist.html', "utf8", async (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      // Check if the adminname matches the session data rolename
      if (adminname === session.data.rolename) {
        const [rows, fields] =
          await pool.execute(`SELECT DISTINCT  c.website,p.Cloud_type,p.name,DATE_FORMAT(p.last_reviewed_Date,'%Y-%m-%d') as last_reviewed_Date,DATE_FORMAT(p.next_review_Date,'%Y-%m-%d') as next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names,DATE_FORMAT(p.created_at,'%Y-%m-%d') as created_at FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id  GROUP BY
                    c.website,
                    p.Cloud_type,
                    p.name,
                    p.last_reviewed_Date,
                    p.next_review_Date,
                    p.financial_services_client_types,
                    c.name,
                    p.Id ORDER BY p.created_at DESC;`);

                    //Check if the query is for today's data
 if(q.query.qty == "today"){
                      //Execute the query to get the data for today
                      const [rows, fields] =
                      await pool.execute(`SELECT DISTINCT  c.website,p.Cloud_type,p.name,DATE_FORMAT(p.last_reviewed_Date,'%Y-%m-%d') as last_reviewed_Date,DATE_FORMAT(p.next_review_Date,'%Y-%m-%d') as next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names,DATE_FORMAT(p.created_at,'%Y-%m-%d') as created_at FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id  WHERE MONTH(p.created_at)=${month} and DAY(p.created_at)=${day} and YEAR(p.created_at) = ${year} GROUP BY
                      c.website,
                      p.Cloud_type,
                      p.name,
                      p.last_reviewed_Date,
                      p.next_review_Date,
                      p.financial_services_client_types,
                      c.name,
                      p.Id ORDER BY p.created_at DESC;`);

                    
                                                    //Store the data in the rowgotten variable
                      rowgotten = rows;
                      }else{
                        const [rows, fields] =
                        await pool.execute(`SELECT DISTINCT  c.website,p.Cloud_type,p.name,DATE_FORMAT(p.last_reviewed_Date,'%Y-%m-%d') as last_reviewed_Date,DATE_FORMAT(p.next_review_Date,'%Y-%m-%d') as next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names,DATE_FORMAT(p.created_at,'%Y-%m-%d') as created_at FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id  GROUP BY
                    c.website,
                    p.Cloud_type,
                    p.name,
                    p.last_reviewed_Date,
                    p.next_review_Date,
                    p.financial_services_client_types,
                    c.name,
                    p.Id ORDER BY p.created_at DESC;`);
                        rowgotten = rows;
                      }
      } else {
        const [rows, fields] = await pool.execute(
          `SELECT DISTINCT c.website,p.Cloud_type,p.name,DATE_FORMAT(p.last_reviewed_Date,'%Y-%m-%d') as last_reviewed_Date,DATE_FORMAT(p.next_review_Date,'%Y-%m-%d') as next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names,DATE_FORMAT(p.created_at,'%Y-%m-%d') as created_at FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id  WHERE p.Company_id = ? GROUP BY
                                            c.website,
                                            p.Cloud_type,
                                            p.name,
                                            p.last_reviewed_Date,
                                            p.next_review_Date,
                                            p.financial_services_client_types,
                                            c.name,
                                            p.Id ORDER BY p.created_at DESC;`,
          [session.data.id]
        );
        rowgotten = rows;
        //building some html dynamic session
        addproductbutton = `<a href="./addproduct.html"><button class="btn" style="background-color:aquamarine;color:black">Add Product</button></a>`;
      }
      if (rowgotten.length < 1) {
        productslists += "<tr><td>no data available</td></tr>";
      } else {
        for (var result of rowgotten) {
         
            deleteButton = `<td><a href="./deleteproduct?id=${result.Id}&w=0" > Delete product</a></td>`;
          
          
            var wished = `<td style="font-weight:bolder;font-size:20px;text-align:center" >-</td>`;
          
          //building some html dynamic session
          productslists += ` <tr> <td> ${result.name}</td>
            <td>${result.concatenated_names}</td>
            ${wished}
            <td>${result.cname}</td>
            <td>${result.created_at}</td>
            <td>${result.last_reviewed_Date}</td>
            <td>${result.next_review_Date}</td>
           
            <td><a href="./product.html?id=${result.Id}" > View Details</a></td> 
           ${deleteButton}
          </tr>`;
        }
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      datas = data
        .replace(/\{\{navbar\}\}/g, navbar1)
        .replace(/\{\{productlist\}\}/g, productslists)
        .replace(/\{\{addproductbutton\}\}/g, addproductbutton)
        .replace(/\{\{alerted\}\}/g, session.alerted);
      res.end(datas);
    }
  });
}
  
  // Serve the HTML view product list
  if (pathname === "./addproduct.html") {
   
    // Read the file addproduct.html and store it in the data variable
   fs.readFile('./views/addproduct.html', "utf8",async (err, data3) => {
      // If there is an error, send a 500 error response
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {

        const [rows, fields] = await pool.execute(
          `SELECT DISTINCT c.website,p.Cloud_type,p.name,DATE_FORMAT(p.last_reviewed_Date,'%Y-%m-%d') as last_reviewed_Date,DATE_FORMAT(p.next_review_Date,'%Y-%m-%d') as next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names,DATE_FORMAT(p.created_at,'%Y-%m-%d') as created_at FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id  WHERE p.Company_id = ? GROUP BY
                                            c.website,
                                            p.Cloud_type,
                                            p.name,
                                            p.last_reviewed_Date,
                                            p.next_review_Date,
                                            p.financial_services_client_types,
                                            c.name,
                                            p.Id ORDER BY p.created_at DESC;`,
          [session.data.id]
        );
        // Send a 200 OK response with the HTML data
        res.writeHead(200, { "Content-Type": "text/html" });
                 // Create a new Promise to replace the navbar template with the actual data
                 console.log(navbar1);
                 datas = data3.replace(/\{\{\{navbar\}\}\}/g, navbar1);
        res.write(datas);
        res.end();
      }
    });
  }

  
  // Serve the HTML view product list
  if (pathname === "./chooseeditproduct.html") {
   
    // Read the file addproduct.html and store it in the data variable
   fs.readFile('./views/chooseeditproduct.html', "utf8",async (err, data3) => {
      // If there is an error, send a 500 error response
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {

       
        res.writeHead(200, { "Content-Type": "text/html" });
                 // Create a new Promise to replace the navbar template with the actual data
                 console.log(navbar1);
                 datas = data3.replace(/\{\{\{navbar\}\}\}/g, navbar1).replace(/\{\{id\}\}/g, q.query.id);
        res.write(datas);
        res.end();
      }
    });
  }


  // Serve the HTML view edit product 
  if (pathname === "./editproduct.html") {
    var country_id_check = 0;
    var gender_id_check = "";
    var softwType_id_check = "";
    fs.readFile('./views/editproduct.html', "utf8", async (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // You can also iterate over the results and access individual rows
        const [rows, fields] = await pool.execute(
          `SELECT GROUP_CONCAT(pt.name)  as concatenated_names,p.id,p.name,p.business_areas,p.description,p.modules,p.financial_services_client_types,p.Cloud_type,p.last_reviewed_Date,p.next_review_Date,p.Company_id,p.active,p.additional_info  FROM product as p INNER JOIN product_product_type as ppt ON ppt.product_id = p.id INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.id = ?;`,
          [q.query.id]
        );

        for (let result of rows) {
          const originalDate = result.last_reviewed_Date;
          const utcYear = originalDate.getUTCFullYear();
          const utcMonth = originalDate.getUTCMonth() + 1; // Months are zero-based, so add 1
          const utcDay = originalDate.getUTCDate();
          const utcHours = originalDate.getUTCHours();
          const utcMinutes = originalDate.getUTCMinutes();
          const utcSeconds = originalDate.getUTCSeconds();

          // Format the date string in the required format
          const formattedDateString = `${utcYear}-${
            (utcMonth < 10 ? "0" : "") + utcMonth
          }-${(utcDay < 10 ? "0" : "") + utcDay}T${
            (utcHours < 10 ? "0" : "") + utcHours
          }:${(utcMinutes < 10 ? "0" : "") + utcMinutes}:${
            (utcSeconds < 10 ? "0" : "") + utcSeconds
          }.000Z`;

          const originalDate2 = result.next_review_Date;
          const utcYear2 = originalDate2.getUTCFullYear();
          const utcMonth2 = originalDate2.getUTCMonth() + 1; // Months are zero-based, so add 1
          const utcDay2 = originalDate2.getUTCDate();
          const utcHours2 = originalDate2.getUTCHours();
          const utcMinutes2 = originalDate2.getUTCMinutes();
          const utcSeconds2 = originalDate2.getUTCSeconds();

          // Format the date string in the required format
          const formattedDateString2 = `${utcYear2}-${
            (utcMonth2 < 10 ? "0" : "") + utcMonth2
          }-${(utcDay2 < 10 ? "0" : "") + utcDay2}T${
            (utcHours2 < 10 ? "0" : "") + utcHours2
          }:${(utcMinutes2 < 10 ? "0" : "") + utcMinutes2}:${
            (utcSeconds2 < 10 ? "0" : "") + utcSeconds2
          }.000Z`;

          cloud_id_check = result.Cloud_type;
          softwType_id_check = result.concatenated_names;
          // This line of code takes the data provided and formats it with the various parameters
   datascentral = data
            // Replace the {{navbar}} placeholder with the navbar1 variable
            .replace(/\{\{navbar\}\}/g, navbar1)
            // Replace the {{softwarename}} placeholder with the result.name variable
            .replace(/\{\{softwarename\}\}/g, `${result.name}`)
            // Replace the {{businessareas}} placeholder with the result.business_areas variable
            .replace(/\{\{businessareas\}\}/g, `${result.business_areas}`)

            // Replace the {{description}} placeholder with the result.description variable
            .replace(/\{\{description\}\}/g, result.description)
            // Replace the {{additionalinformation}} placeholder with the result.additional_info variable
            .replace(/\{\{additionalinformation\}\}/g, result.additional_info)
            // Replace the {{modules}} placeholder with the result.modules variable
            .replace(/\{\{modules\}\}/g, result.modules)
            // Replace the {{financialservicesclientypes}} placeholder with the result.financial_services_client_types variable
            .replace(/\{\{financialservicesclientypes\}\}/g, result.financial_services_client_types)
            // Replace the {{lastreview}} placeholder with the formattedDateString.split("T")[0] variable
            .replace(/\{\{lastreview\}\}/g, formattedDateString.split("T")[0])
            // Replace the {{nextreview}} placeholder with the formattedDateString2.split("T")[0] variable
            .replace(/\{\{nextreview\}\}/g, formattedDateString2.split("T")[0])
            // Replace the {{id}} placeholder with the result.id variable
            .replace(/\{\{id\}\}/g, result.id)
            // Replace the {{companyid}} placeholder with the result.Company_id variable
            .replace(/\{\{companyid\}\}/g, result.Company_id);

          console.log("result.dateofbirth.toString(.split()[0]");
        }
        //building some html dynamic session
        datas200 += '<option value="">--select Cloud Type--</option>';

        // This function creates the cloud options for the HTML select element.
        if ("native" == cloud_id_check) {
          datas200 += `<option value="native" selected>Native</option>`;
        } else {
          datas200 += `<option value="native">Native</option>`;
        }
        if ("enabled" == cloud_id_check) {
          datas200 += `<option value="enabled" selected>Enabled</option>`;
        } else {
          datas200 += `<option value="enabled">Enabled</option>`;
        }

        if ("based" == cloud_id_check) {
          datas200 += `<option value="based" selected>Based</option>`;
        } else {
          datas200 += `<option value="based">Based</option>`;
        }

        // This line checks if the softwType_id_check variable is not empty.
        if (softwType_id_check) {
          // This line splits the softwType_id_check variable into an array called types.
          var types = softwType_id_check.trim().split(",");

          // This loop iterates through the types array and checks if the type is "Process Automation".
          if (types.includes("Process Automation")) {
            // This line adds the Process Automation checkbox to the HTML select element.
            datas300 += `<div class="row"> 
            <div class="col">
            <div class="form-check">
                  <label  class="form-check-input"  for="v1">Process Automation</label>
                  <input type="checkbox" class="form-check-input" name="z1" value="1" id="v1" checked >
              </div></div>`;
          } else {
            datas300 += `<div class="row">  <div class="col"><div class="form-check"> 
                  <label  class="form-check-input"  for="v1">Process Automation</label>
                  <input type="checkbox" class="form-check-input" name="z1" value="1" id="v1">
                  </div></div>`;
          }
          if (types.includes("Alternative Investment")) {
            datas300 += `<div class="col"><div class="form-check"> 
                  <label  class="form-check-input"  for="v2">Alternative Investment</label>
                  <input type="checkbox" class="form-check-input" name="z2" value="2" id="v2" checked >
                  </div></div>`;
          } else {
            datas300 += `<div class="col"><div class="form-check">  
                  <label  class="form-check-input"  for="v2">Alternative Investment</label>
                  <input type="checkbox" class="form-check-input" name="z2" value="2" id="v2"  >
                  </div></div>`;
          }
          if (types.includes("Data Management")) {
            datas300 += `<div class="col"><div class="form-check">
                  <label  class="form-check-input"  for="v3">Data Management</label>
                  <input type="checkbox" class="form-check-input" name="z3" value="3" id="v3" checked >
              </div></div></div>`;
          } else {
            datas300 += `<div class="col"><div class="form-check">
                  <label  class="form-check-input"  for="v3">Data Management</label>
                  <input type="checkbox" class="form-check-input" name="z3" value="3" id="v3"  >
              </div></div></div>`;
          }
          if (types.includes("Data Transformation")) {
            datas300 += `<div class="row"><div class="col"><div class="form-check"> 
                  <label  class="form-check-input"  for="v4">Data Transformation</label>
                  <input type="checkbox" class="form-check-input" name="4" value="4" id="v4" checked >
              </div></div>`;
          } else {
            datas300 += `<div class="row"> <div class="col"><div class="form-check">
                  <label  class="form-check-input"  for="v4">Data Transformation</label>
                  <input type="checkbox" class="form-check-input" name="z4" value="4" id="v4"  >
              </div></div>`;
          }
          if (types.includes("Artificial Intelligence")) {
            datas300 += `<div class="col"><div class="form-check"> 
                  <label  class="form-check-input"  for="v5">Artificial Intelligence</label>
                  <input type="checkbox" class="form-check-input" name="z5" value="5" id="v5" checked >
              </div></div>`;
          } else {
            datas300 += `<div class="col"><div class="form-check">
                  <label  class="form-check-input"  for="v5">Artificial Intelligence</label>
                  <input type="checkbox" class="form-check-input" name="z5" value="5" id="v5"  >
              </div></div>`;
          }
          if (types.includes("Portfolio Management Trading")) {
            datas300 += `<div class="col"><div class="form-check"> 
                  <label  class="form-check-input"  for="v6">Portfolio Management Trading</label>
                  <input type="checkbox" required class="form-check-input" name="z6" value="6" id="v6" checked >
              </div></div></div>`;
          } else {
            datas300 += `<div class="col"><div class="form-check">
                  <label  class="form-check-input"  for="v6">Portfolio Management Trading</label>
                  <input type="checkbox" required class="form-check-input" name="z6" value="6" id="v6"  >
              </div></div></div>`;
          }
        } else {
          datas300 += `<div class="row"> <div class="col"><div class="form-check">
               <label  class="form-check-input"  for="v1">Process Automation</label>
               <input type="checkbox" class="form-check-input" name="z1" value="1" id="v1"  >
           </div></div>`;

          datas300 += `<div class="col"><div class="form-check">
               <label  class="form-check-input"  for="v2">Alternative Investment</label>
               <input type="checkbox" class="form-check-input" name="z2" value="2" id="v2"  >
           </div></div>`;

          datas300 += `<div class="col"><div class="form-check">
               <label  class="form-check-input"  for="v3">Data Management</label>
               <input type="checkbox" class="form-check-input" name="z3" value="3" id="v3"  >
           </div></div></div>`;

          datas300 += `<div class="row"> <div class="col"><div class="form-check">
               <label  class="form-check-input"  for="v4">Data Transformation</label>
               <input type="checkbox" class="form-check-input" name="z4" value="4" id="v4"  >
           </div></div>`;

          datas300 += `<div class="col"><div class="form-check">
               <label  class="form-check-input"  for="v5">Artificial Intelligence</label>
               <input type="checkbox" class="form-check-input" name="z5" value="5" id="v5"  >
           </div></div>`;

          datas300 += `<div class="col"><div class="form-check"> 
               <label  class="form-check-input"  for="v6">Portfolio Management Trading</label>
               <input type="checkbox" required class="form-check-input" name="z6" value="6" id="v6"  >
           </div></div></div>`;
        }

        datascentral = datascentral
          .replace(/\{\{cloud\}\}/g, datas200)
          .replace(/\{\{softwaretype\}\}/g, datas300);

        var fetchedQuery = q.query; //returns an object: { year: 2017, month: 'february' }
        // data = data
        //   .replace(/\{\{countryoption\}\}/g, datas)
        res.writeHead(200, { "Content-Type": "text/html" });
        //res.wr(datascentral);
        res.end(datascentral);
      }
    });
  }


    // Serve the HTML view edit product 
    if (pathname === "./editproductinfo.html") {
      var country_id_check = 0;
      var gender_id_check = "";
      var softwType_id_check = "";
      fs.readFile('./views/editproductinfo.html', "utf8", async (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        } else {
          // You can also iterate over the results and access individual rows
          const [rows, fields] = await pool.execute(
            `SELECT GROUP_CONCAT(pt.name)  as concatenated_names,p.id,p.name,p.business_areas,p.description,p.modules,p.financial_services_client_types,p.Cloud_type,p.last_reviewed_Date,p.next_review_Date,p.Company_id,p.active,p.additional_info  FROM product as p INNER JOIN product_product_type as ppt ON ppt.product_id = p.id INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.id = ?;`,
            [q.query.id]
          );
  
          for (let result of rows) {
          
            cloud_id_check = result.Cloud_type;
            softwType_id_check = result.concatenated_names;
            // This line of code takes the data provided and formats it with the various parameters
     datascentral = data
              // Replace the {{navbar}} placeholder with the navbar1 variable
              .replace(/\{\{navbar\}\}/g, navbar1)
              // Replace the {{softwarename}} placeholder with the result.name variable
              .replace(/\{\{softwarename\}\}/g, `${result.name}`)
              // Replace the {{businessareas}} placeholder with the result.business_areas variable
              .replace(/\{\{businessareas\}\}/g, `${result.business_areas}`)
  
              // Replace the {{description}} placeholder with the result.description variable
              .replace(/\{\{description\}\}/g, result.description)
              // Replace the {{additionalinformation}} placeholder with the result.additional_info variable
              .replace(/\{\{additionalinformation\}\}/g, result.additional_info)
              // Replace the {{modules}} placeholder with the result.modules variable
              .replace(/\{\{modules\}\}/g, result.modules)
              // Replace the {{financialservicesclientypes}} placeholder with the result.financial_services_client_types variable
              .replace(/\{\{financialservicesclientypes\}\}/g, result.financial_services_client_types)
             
              // Replace the {{id}} placeholder with the result.id variable
              .replace(/\{\{id\}\}/g, result.id)
              // Replace the {{companyid}} placeholder with the result.Company_id variable
              .replace(/\{\{companyid\}\}/g, result.Company_id);
  
            console.log("result.dateofbirth.toString(.split()[0]");
          }
          //building some html dynamic session
          datas200 += '<option value="">--select Cloud Type--</option>';
  
          // This function creates the cloud options for the HTML select element.
          if ("native" == cloud_id_check) {
            datas200 += `<option value="native" selected>Native</option>`;
          } else {
            datas200 += `<option value="native">Native</option>`;
          }
          if ("enabled" == cloud_id_check) {
            datas200 += `<option value="enabled" selected>Enabled</option>`;
          } else {
            datas200 += `<option value="enabled">Enabled</option>`;
          }
  
          if ("based" == cloud_id_check) {
            datas200 += `<option value="based" selected>Based</option>`;
          } else {
            datas200 += `<option value="based">Based</option>`;
          }
  
          // This line checks if the softwType_id_check variable is not empty.
          if (softwType_id_check) {
            // This line splits the softwType_id_check variable into an array called types.
            var types = softwType_id_check.trim().split(",");
  
            // This loop iterates through the types array and checks if the type is "Process Automation".
            if (types.includes("Process Automation")) {
              // This line adds the Process Automation checkbox to the HTML select element.
              datas300 += `<div class="row"> 
              <div class="col">
              <div class="form-check">
                    <label  class="form-check-input"  for="v1">Process Automation</label>
                    <input type="checkbox" class="form-check-input" name="z1" value="1" id="v1" checked >
                </div></div>`;
            } else {
              datas300 += `<div class="row">  <div class="col"><div class="form-check"> 
                    <label  class="form-check-input"  for="v1">Process Automation</label>
                    <input type="checkbox" class="form-check-input" name="z1" value="1" id="v1">
                    </div></div>`;
            }
            if (types.includes("Alternative Investment")) {
              datas300 += `<div class="col"><div class="form-check"> 
                    <label  class="form-check-input"  for="v2">Alternative Investment</label>
                    <input type="checkbox" class="form-check-input" name="z2" value="2" id="v2" checked >
                    </div></div>`;
            } else {
              datas300 += `<div class="col"><div class="form-check">  
                    <label  class="form-check-input"  for="v2">Alternative Investment</label>
                    <input type="checkbox" class="form-check-input" name="z2" value="2" id="v2"  >
                    </div></div>`;
            }
            if (types.includes("Data Management")) {
              datas300 += `<div class="col"><div class="form-check">
                    <label  class="form-check-input"  for="v3">Data Management</label>
                    <input type="checkbox" class="form-check-input" name="z3" value="3" id="v3" checked >
                </div></div></div>`;
            } else {
              datas300 += `<div class="col"><div class="form-check">
                    <label  class="form-check-input"  for="v3">Data Management</label>
                    <input type="checkbox" class="form-check-input" name="z3" value="3" id="v3"  >
                </div></div></div>`;
            }
            if (types.includes("Data Transformation")) {
              datas300 += `<div class="row"><div class="col"><div class="form-check"> 
                    <label  class="form-check-input"  for="v4">Data Transformation</label>
                    <input type="checkbox" class="form-check-input" name="4" value="4" id="v4" checked >
                </div></div>`;
            } else {
              datas300 += `<div class="row"> <div class="col"><div class="form-check">
                    <label  class="form-check-input"  for="v4">Data Transformation</label>
                    <input type="checkbox" class="form-check-input" name="z4" value="4" id="v4"  >
                </div></div>`;
            }
            if (types.includes("Artificial Intelligence")) {
              datas300 += `<div class="col"><div class="form-check"> 
                    <label  class="form-check-input"  for="v5">Artificial Intelligence</label>
                    <input type="checkbox" class="form-check-input" name="z5" value="5" id="v5" checked >
                </div></div>`;
            } else {
              datas300 += `<div class="col"><div class="form-check">
                    <label  class="form-check-input"  for="v5">Artificial Intelligence</label>
                    <input type="checkbox" class="form-check-input" name="z5" value="5" id="v5"  >
                </div></div>`;
            }
            if (types.includes("Portfolio Management Trading")) {
              datas300 += `<div class="col"><div class="form-check"> 
                    <label  class="form-check-input"  for="v6">Portfolio Management Trading</label>
                    <input type="checkbox" required class="form-check-input" name="z6" value="6" id="v6" checked >
                </div></div></div>`;
            } else {
              datas300 += `<div class="col"><div class="form-check">
                    <label  class="form-check-input"  for="v6">Portfolio Management Trading</label>
                    <input type="checkbox" required class="form-check-input" name="z6" value="6" id="v6"  >
                </div></div></div>`;
            }
          } else {
            datas300 += `<div class="row"> <div class="col"><div class="form-check">
                 <label  class="form-check-input"  for="v1">Process Automation</label>
                 <input type="checkbox" class="form-check-input" name="z1" value="1" id="v1"  >
             </div></div>`;
  
            datas300 += `<div class="col"><div class="form-check">
                 <label  class="form-check-input"  for="v2">Alternative Investment</label>
                 <input type="checkbox" class="form-check-input" name="z2" value="2" id="v2"  >
             </div></div>`;
  
            datas300 += `<div class="col"><div class="form-check">
                 <label  class="form-check-input"  for="v3">Data Management</label>
                 <input type="checkbox" class="form-check-input" name="z3" value="3" id="v3"  >
             </div></div></div>`;
  
            datas300 += `<div class="row"> <div class="col"><div class="form-check">
                 <label  class="form-check-input"  for="v4">Data Transformation</label>
                 <input type="checkbox" class="form-check-input" name="z4" value="4" id="v4"  >
             </div></div>`;
  
            datas300 += `<div class="col"><div class="form-check">
                 <label  class="form-check-input"  for="v5">Artificial Intelligence</label>
                 <input type="checkbox" class="form-check-input" name="z5" value="5" id="v5"  >
             </div></div>`;
  
            datas300 += `<div class="col"><div class="form-check"> 
                 <label  class="form-check-input"  for="v6">Portfolio Management Trading</label>
                 <input type="checkbox" required class="form-check-input" name="z6" value="6" id="v6"  >
             </div></div></div>`;
          }
  
          datascentral = datascentral
            .replace(/\{\{cloud\}\}/g, datas200)
            .replace(/\{\{softwaretype\}\}/g, datas300);
  
          var fetchedQuery = q.query; //returns an object: { year: 2017, month: 'february' }
          // data = data
          //   .replace(/\{\{countryoption\}\}/g, datas)
          res.writeHead(200, { "Content-Type": "text/html" });
          //res.wr(datascentral);
          res.end(datascentral);
        }
      });
    }

    // Serve the HTML view edit product 
    if (pathname === "./editproductupload.html") {
      var country_id_check = 0;
      var gender_id_check = "";
      var softwType_id_check = "";
      fs.readFile('./views/editproductupload.html', "utf8", async (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        } else {
          // You can also iterate over the results and access individual rows
          const [rows, fields] = await pool.execute(
            `SELECT GROUP_CONCAT(pt.name)  as concatenated_names,p.id,p.name,p.business_areas,p.description,p.modules,p.financial_services_client_types,p.Cloud_type,p.last_reviewed_Date,p.next_review_Date,p.Company_id,p.active,p.additional_info  FROM product as p INNER JOIN product_product_type as ppt ON ppt.product_id = p.id INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.id = ?;`,
            [q.query.id]
          );
  
          for (let result of rows) {
         
  
            cloud_id_check = result.Cloud_type;
            softwType_id_check = result.concatenated_names;
            // This line of code takes the data provided and formats it with the various parameters
     datascentral = data
              // Replace the {{navbar}} placeholder with the navbar1 variable
              .replace(/\{\{navbar\}\}/g, navbar1)
              // Replace the {{softwarename}} placeholder with the result.name variable
              .replace(/\{\{softwarename\}\}/g, `${result.name}`)
          
              // Replace the {{id}} placeholder with the result.id variable
              .replace(/\{\{id\}\}/g, result.id)
              // Replace the {{companyid}} placeholder with the result.Company_id variable
              .replace(/\{\{companyid\}\}/g, result.Company_id);
  
            console.log("result.dateofbirth.toString(.split()[0]");
          }
         
          //   .replace(/\{\{countryoption\}\}/g, datas)
          res.writeHead(200, { "Content-Type": "text/html" });
          //res.wr(datascentral);
          res.end(datascentral);
        }
      });
    }
  
    
  
  // Serve the HTML view edit product 
  if (pathname === "./editproductreview.html") {
    var country_id_check = 0;
    var gender_id_check = "";
    var softwType_id_check = "";
    fs.readFile('./views/editproductreview.html', "utf8", async (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // You can also iterate over the results and access individual rows
        console.log('check edit reiview id',q.query)
        const [rows, fields] = await pool.execute(
          `SELECT GROUP_CONCAT(pt.name)  as concatenated_names,p.id,p.name,p.business_areas,p.description,p.modules,p.financial_services_client_types,p.Cloud_type,p.last_reviewed_Date,p.next_review_Date,p.Company_id,p.active,p.additional_info  FROM product as p INNER JOIN product_product_type as ppt ON ppt.product_id = p.id INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.id = ?;`,
          [q.query.id]
        );

        for (let result of rows) {
          const originalDate = result.last_reviewed_Date;
          const utcYear = originalDate.getUTCFullYear();
          const utcMonth = originalDate.getUTCMonth() + 1; // Months are zero-based, so add 1
          const utcDay = originalDate.getUTCDate();
          const utcHours = originalDate.getUTCHours();
          const utcMinutes = originalDate.getUTCMinutes();
          const utcSeconds = originalDate.getUTCSeconds();

          // Format the date string in the required format
          const formattedDateString = `${utcYear}-${
            (utcMonth < 10 ? "0" : "") + utcMonth
          }-${(utcDay < 10 ? "0" : "") + utcDay}T${
            (utcHours < 10 ? "0" : "") + utcHours
          }:${(utcMinutes < 10 ? "0" : "") + utcMinutes}:${
            (utcSeconds < 10 ? "0" : "") + utcSeconds
          }.000Z`;

          const originalDate2 = result.next_review_Date;
          const utcYear2 = originalDate2.getUTCFullYear();
          const utcMonth2 = originalDate2.getUTCMonth() + 1; // Months are zero-based, so add 1
          const utcDay2 = originalDate2.getUTCDate();
          const utcHours2 = originalDate2.getUTCHours();
          const utcMinutes2 = originalDate2.getUTCMinutes();
          const utcSeconds2 = originalDate2.getUTCSeconds();

          // Format the date string in the required format
          const formattedDateString2 = `${utcYear2}-${
            (utcMonth2 < 10 ? "0" : "") + utcMonth2
          }-${(utcDay2 < 10 ? "0" : "") + utcDay2}T${
            (utcHours2 < 10 ? "0" : "") + utcHours2
          }:${(utcMinutes2 < 10 ? "0" : "") + utcMinutes2}:${
            (utcSeconds2 < 10 ? "0" : "") + utcSeconds2
          }.000Z`;

          cloud_id_check = result.Cloud_type;
          softwType_id_check = result.concatenated_names;
          // This line of code takes the data provided and formats it with the various parameters
   datascentral = data
            // Replace the {{navbar}} placeholder with the navbar1 variable
            .replace(/\{\{navbar\}\}/g, navbar1)
            // Replace the {{softwarename}} placeholder with the result.name variable
         
            // Replace the {{lastreview}} placeholder with the formattedDateString.split("T")[0] variable
            .replace(/\{\{lastreview\}\}/g, formattedDateString.split("T")[0])
            // Replace the {{nextreview}} placeholder with the formattedDateString2.split("T")[0] variable
            .replace(/\{\{nextreview\}\}/g, formattedDateString2.split("T")[0])
            // Replace the {{id}} placeholder with the result.id variable
            .replace(/\{\{id\}\}/g, result.id)
            // Replace the {{companyid}} placeholder with the result.Company_id variable
            .replace(/\{\{companyid\}\}/g, result.Company_id);

          console.log("result.dateofbirth.toString(.split()[0]");
        }
        //building some html dynamic session
      

        res.writeHead(200, { "Content-Type": "text/html" });
        //res.wr(datascentral);
        res.end(datascentral);
      }
    });
  }

  // Serve the HTML view delete product list
  if (pathname === "./deleteproduct") {
    fs.readFile("./views/index.html", "utf8", async (err, data) => {
      if (err) {
        getAlertCookie(0, "Product have not deleted successfully",res);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        if (q.query.id && q.query.w.trim() === "0") {
          console.log(q.query.id);
          console.log("deleteproduct..........");

          const [row1, fields1] = await pool.execute(
            `DELETE FROM product_product_type WHERE product_id=?`,
            [q.query.id]
          );
          
          const [rows, fields] = await pool.execute(
            `DELETE FROM product WHERE Id=?`,
            [q.query.id]
          );
         
        getAlertCookie(
            1,
            "Product have been deleted successfully",res
          );
          
        } else {
          getAlertCookie(
            0,
            "Product have not deleted successfully",res
          );
        }
       
        res.writeHead(302, {
          "Content-Type": "text/html",
          Location: host1 + "/viewproductlist.html",
        });
        res.end();
      }
    });
  }
  
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
   // Serve the HTML view setupregister 
if (pathname === "./setupregister.html") {
  fs.readFile('./views/setupregister.html', "utf8", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
}

 // Serve the HTML view register
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

// Serve the HTML view pdf
if (pathname === "./pdf.html") {
  console.log(q.query.doc);
  console.log("q.query.idooooooooooooooooo");
  // Asynchronously read the file `pdf.html` and store it in the `data` variable
  fs.readFile('./views/pdf.html', "utf8", async (err, data) => {
    // If there is an error, return a 500 Internal Server Error
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      // Otherwise, execute the SQL query to fetch the required data
      const [rows, fields] = await pool.execute(
        `SELECT DISTINCT c.website,p.Cloud_type,p.name,p.last_reviewed_Date,p.pdf,p.modules,p.next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names  FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.id = ? GROUP BY
                c.website,
                p.Cloud_type,
                p.name,
                p.last_reviewed_Date,
                p.next_review_Date,
                p.financial_services_client_types,
                c.name,
                p.Id;`,
        [q.query.doc]
      );
      // Loop through the results and replace the `{{pdf}}` placeholder with the actual PDF URL
      for (let result of rows) {
        datas = data.replace(/\{\{pdf\}\}/g, result.pdf);
      }

      // Return the file `pdf.html` with the replaced `{{pdf}}` placeholder
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(datas);
    }
  });
}

 // Serve the HTML view product card
 if (pathname === "./product.html") {
  
 
  console.log(q.query);
  let data4pdf = "";
  let yourrate = "";
  console.log("q.query............");
  fs.readFile('./views/product.html', "utf8", async (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      // Asynchronously execute the query and get the number of rows and fields returned
 const [rows, fields] = await pool.execute(
        `SELECT DISTINCT  c.id as cid ,c.website,p.Cloud_type,p.name,p.pdf,p.description,p.business_areas,p.modules,DATE_FORMAT(p.last_reviewed_Date,'%Y-%m-%d') as last_reviewed_Date,DATE_FORMAT(p.next_review_Date,'%Y-%m-%d') as next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.id = ? GROUP BY
                c.website,
                p.Cloud_type,
                p.name,
                p.last_reviewed_Date,
                p.next_review_Date,
                p.financial_services_client_types,
                c.name,
                p.Id;`,
        [q.query.id]
      );

      // This line executes a query to select the average rate of a product from the rate_product table, and returns the rows and fields as an array

      console.log(rows);
      console.log("rowsrrrrrrrrrr..........");
      for (let result of rows) {
        var filerecord =
          __dirname + `\\uploads\\product\\${result.name}.pdf`;
        let editbutton = "";
        let editwish = "";
        let editwishdecision = "";
       
          editbutton = `<p><a href="chooseeditproduct.html?id=${result.Id}"><button>Edit</button></a></p>`;
        
        if (result.pdf) {
          data4pdf = `<p><small>Pdf Document</small>:  <a href="./pdf.html?doc=${result.Id}"  >download attchment</a></p>`;
        }
   
        datas = data
          .replace(/\{\{navbar\}\}/g, navbar1)//Replace the {{navbar}} with the variable navbar1
          .replace(/\{\{typeofsoftware\}\}/g, result.concatenated_names)//Replace the {{typeofsoftware}} with the variable concatenated_names
          .replace(/\{\{modules\}\}/g, result.modules)//Replace the {{modules}} with the variable modules
          .replace(/\{\{businessareas\}\}/g, result.business_areas)//Replace the {{businessareas}} with the variable business_areas
          .replace(/\{\{cloud\}\}/g, result.Cloud_type)//Replace the {{cloud}} with the variable Cloud_type
          .replace(
            /\{\{clientservice\}\}/g,
            result.financial_services_client_types
          )//Replace the {{clientservice}} with the variable financial_services_client_types
          .replace(/\{\{companyname\}\}/g, result.cname)//Replace the {{companyname}} with the variable cname
          .replace(/\{\{description\}\}/g, result.description)//Replace the {{description}} with the variable description
          .replace(/\{\{Website\}\}/g, result.website)//Replace the {{Website}} with the variable website
          .replace(/\{\{pdf\}\}/g, result.pdf)//Replace the {{pdf}} with the variable pdf
          .replace(/\{\{lastdatereviewed\}\}/g, result.last_reviewed_Date)//Replace the {{lastdatereviewed}} with the variable last_reviewed_Date
          .replace(/\{\{nextdatereview\}\}/g, result.next_review_Date)//Replace the {{nextdatereview}} with the variable next_review_Date
          .replace(/\{\{pid\}\}/g, data4pdf)//Replace the {{pid}} with the variable data4pdf
          .replace(/\{\{productname\}\}/g, result.name)//Replace the {{productname}} with the variable name
          .replace(/\{\{editbutton\}\}/g, editbutton)//Replace the {{editbutton}} with the variable editbutton
          .replace(/\{\{vid\}\}/g, result.cid)//Replace the {{vid}} with the variable cid
          .replace(/\{\{id\}\}/g, result.Id)//Replace the {{id}} with the variable Id
          .replace(/\{\{hearted\}\}/g, editwish)//Replace the {{hearted}} with the variable editwish
          .replace(/\{\{decide\}\}/g, editwishdecision)//Replace the {{decide}} with the variable editwishdecision
          
          .replace(/\{\{decideval\}\}/g, result.wid == 0 ? "1" : "0").replace(/\{\{alerted\}\}/g, session.alerted);
      }
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(datas);
  });
}

 // Serve the HTML view profile card
if (pathname === "./profile.html")  {
 console.log(q.query.id); console.log("q.query.id");let userid = "";
  fs.readFile('./views/profile.html', "utf8", async (err, data) => {
    // If there is an error
    if (err) {
      // Write a 500 error response
      res.writeHead(500, { "Content-Type": "text/plain" });
      // End the response with "Internal Server Error"
      res.end("Internal Server Error");
    } else {
      // Otherwise, execute a query to get the user's information
      const [rows, fields] = await pool.execute(
        `SELECT GROUP_CONCAT(pt.name) as concatenated_names,u.email,u.firstname,u.lastname,u.username,u.address,u.dateofbirth,u.phonenumber,c.name,u.gender,u.id FROM users as u INNER JOIN user_product_type_choice as uppt ON uppt.user_id = u.id INNER JOIN country as c ON u.country_id = c.id  INNER JOIN product_type as pt ON pt.id = uppt.product_type_id WHERE u.id = ?  group by u.email;`,
        [q.query.id]
      );

      // Log the rows to the console
      console.log(rows);
      console.log("jfjfjjfrows................");
      // If the user's information is found
      if (rows[0].id) {
        // Loop through the rows and replace the placeholders in the data
        for (let result of rows) {
          console.log(result.dateofbirth);
          console.log(result.dateofbirth.toString("dd-MM-yyyy"));
          console.log("result.dateofbirth.toString");
          datas = data
            .replace(/\{\{navbar\}\}/g, navbar1)
            .replace(
              /\{\{fullname\}\}/g,
              `${result.firstname} ${result.lastname}`
            )
            .replace(/\{\{typeofsoftware\}\}/g, result.concatenated_names)
            .replace(/\{\{username\}\}/g, result.username)
            .replace(/\{\{email\}\}/g, result.email)
            .replace(/\{\{address\}\}/g, result.address)
            .replace(/\{\{country\}\}/g, result.name)
            .replace(/\{\{gender\}\}/g, result.gender)
            .replace(
              /\{\{dob\}\}/g,
              result.dateofbirth.toString("dd-MM-yyyy").split("G")[0]
            )
            .replace(/\{\{phonenumber\}\}/g, result.phonenumber)
            .replace(/\{\{id\}\}/g, result.id).replace(/\{\{alerted\}\}/g, session.alerted);
        }
      }
      // Write the updated data as a 200 response
      res.writeHead(200, { "Content-Type": "text/html" });

      // End the response with the updated data
      res.end(datas);
    }
  });
}
 // Serve the HTML view editprofile card
if (pathname === "./editprofile.html") {
  var country_id_check = 0;
  var gender_id_check = "";
  var softwType_id_check = "";
  fs.readFile('./views/editprofile.html', "utf8", async (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      // You can also iterate over the results and access individual rows
      const [rows, fields] = await pool.execute(
        `SELECT GROUP_CONCAT(pt.name)  as concatenated_names,u.email,u.firstname,u.lastname,u.username,u.address,u.dateofbirth,u.phonenumber,c.name,c.id as country_id,u.gender,u.id FROM users as u INNER JOIN user_product_type_choice as uppt ON uppt.user_id = u.id INNER JOIN country as c ON u.country_id = c.id  INNER JOIN product_type as pt ON pt.id = uppt.product_type_id WHERE u.id = ?;`,
        [q.query.id]
      );

      for (let result of rows) {
        // Get the original date of birth
        const originalDate = result.dateofbirth;
        // Get the UTC year, month, and day
        const utcYear = originalDate.getUTCFullYear();
        const utcMonth = originalDate.getUTCMonth() + 1; // Months are zero-based, so add 1
        const utcDay = originalDate.getUTCDate();
        // Get the UTC hours, minutes, and seconds
        const utcHours = originalDate.getUTCHours();
        const utcMinutes = originalDate.getUTCMinutes();
        const utcSeconds = originalDate.getUTCSeconds();

        // Format the date string in the required format
        const formattedDateString = `${utcYear}-${
          (utcMonth < 10 ? "0" : "") + utcMonth
        }-${(utcDay < 10 ? "0" : "") + utcDay}T${
          (utcHours < 10 ? "0" : "") + utcHours
        }:${(utcMinutes < 10 ? "0" : "") + utcMinutes}:${
          (utcSeconds < 10 ? "0" : "") + utcSeconds
        }.000Z`;

        console.log(result.dateofbirth.toString("dd-MM-yyyy"));
        console.log(result.dateofbirth.toString());
        console.log("result.dateofbirth.toString");
        var dob2 = `${result.dateofbirth}`;
        // Store the country, gender, and softwType_id ids
        country_id_check = result.country_id;
        gender_id_check = result.gender;
        softwType_id_check = result.concatenated_names;
        // Store the data
        datascentral = data
          .replace(/\{\{navbar\}\}/g, navbar1)
          .replace(/\{\{firstname\}\}/g, `${result.firstname}`)
          .replace(/\{\{lastname\}\}/g, `${result.lastname}`)

          .replace(/\{\{username\}\}/g, result.username)
          .replace(/\{\{email\}\}/g, result.email)
          .replace(/\{\{address\}\}/g, result.address)
          .replace(
            /\{\{dateofbirth\}\}/g,
            formattedDateString.split("T")[0]
          )
          .replace(/\{\{phonenumber\}\}/g, result.phonenumber)
          .replace(/\{\{id\}\}/g, result.id);

        console.log("result.dateofbirth.toString(.split()[0]");
      }

      const [rows1, fields1] = await pool.execute("SELECT * FROM country");

      datas += '<option value="">--select country--</option>';
      // Loop through the rows1 array
for (let result of rows1) {
  // If the id of the current result matches the country_id_check variable
  if (result.id == country_id_check) {
    // Add a selected option tag with the result id and name to the datas variable
    datas += `<option value="${result.id}" selected>${result.name}</option>`;
  } else {
    // Add an option tag with the result id and name to the datas variable
    datas += `<option value="${result.id}">${result.name}</option>`;
  }
}
// Add a selected option tag with an empty value to the datas200 variable
datas200 += '<option value="">--select gender--</option>';

// If the gender_id_check variable is "male"
if ("male" == gender_id_check) {
  // Add a selected option tag with the "male" value to the datas200 variable
  datas200 += `<option value="male" selected>male</option>`;
} else {
  // Add an option tag with the "male" value to the datas200 variable
  datas200 += `<option value="male">male</option>`;
}

// If the gender_id_check variable is "female"
if ("female" == gender_id_check) {
  // Add a selected option tag with the "female" value to the datas200 variable
  datas200 += `<option value="female" selected>female</option>`;
} else {
  // Add an option tag with the "female" value to the datas200 variable
  datas200 += `<option value="female">female</option>`;
}
      if (softwType_id_check) {
        var types = softwType_id_check.trim().split(",");

        // If Process Automation is included in the types array, add a checkbox with the value of 1 and id of v1, and style the margin-bottom to be 28px.
  if (types.includes("Process Automation")) {
          datas300 += `<div class="row"> 
                <label for="v1">Process Automation</label>
                <input type="checkbox" class="input3" name="z1" value="1" id="v1" checked style="margin-bottom: 28px;">
            </div>`;
        } else {
          // If Process Automation is not included in the types array, add a checkbox with the value of 1 and id of v1, and style the margin-bottom to be 28px.
          datas300 += `<div class="row"> 
                <label for="v1">Process Automation</label>
                <input type="checkbox" class="input3" name="z1" value="1" id="v1"  style="margin-bottom: 28px;">
            </div>`;
        }
        // If Alternative Investment is included in the types array, add a checkbox with the value of 2 and id of v2, and style the margin-bottom to be 28px.
        if (types.includes("Alternative Investment")) {
          datas300 += `<div class="row"> 
                <label for="v2">Alternative Investment</label>
                <input type="checkbox" class="input3" name="z2" value="2" id="v2" checked style="margin-bottom: 28px;">
            </div>`;
        } else {
          // If Alternative Investment is not included in the types array, add a checkbox with the value of 2 and id of v2, and style the margin-bottom to be 28px.
          datas300 += `<div class="row"> 
                <label for="v2">Alternative Investment</label>
                <input type="checkbox" class="input3" name="z2" value="2" id="v2"  style="margin-bottom: 28px;">
            </div>`;
        }
        if (types.includes("Data Management")) {
          datas300 += `<div class="row"> 
                <label for="v3">Data Management</label>
                <input type="checkbox" class="input3" name="z3" value="3" id="v3" checked style="margin-bottom: 28px;">
            </div>`;
        } else {
          datas300 += `<div class="row"> 
                <label for="v3">Data Management</label>
                <input type="checkbox" class="input3" name="z3" value="3" id="v3"  style="margin-bottom: 28px;">
            </div>`;
        }
        if (types.includes("Data Transformation")) {
          datas300 += `<div class="row"> 
                <label for="v4">Data Transformation</label>
                <input type="checkbox" class="input3" name="4" value="4" id="v4" checked style="margin-bottom: 28px;">
            </div>`;
        } else {
          datas300 += `<div class="row"> 
                <label for="v4">Data Transformation</label>
                <input type="checkbox" class="input3" name="z4" value="4" id="v4"  style="margin-bottom: 28px;">
            </div>`;
        }
        if (types.includes("Artificial Intelligence")) {
          datas300 += `<div class="row"> 
                <label for="v5">Artificial Intelligence</label>
                <input type="checkbox" class="input3" name="z5" value="5" id="v5" checked style="margin-bottom: 28px;">
            </div>`;
        } else {
          datas300 += `<div class="row"> 
                <label for="v5">Artificial Intelligence</label>
                <input type="checkbox" class="input3" name="z5" value="5" id="v5"  style="margin-bottom: 28px;">
            </div>`;
        }
        if (types.includes("Portfolio Management Trading")) {
          datas300 += `<div class="row"> 
                <label for="v6">Portfolio Management Trading</label>
                <input type="checkbox" class="input3" name="z6" value="6" id="v6" checked style="margin-bottom: 28px;">
            </div>`;
        } else {
          datas300 += `<div class="row"> 
                <label for="v6">Portfolio Management Trading</label>
                <input type="checkbox" class="input3" name="z6" value="6" id="v6"  style="margin-bottom: 28px;">
            </div>`;
        }
      } else {
        datas300 += `<div class="row"> 
             <label for="v1">Process Automation</label>
             <input type="checkbox" class="input3" name="z1" value="1" id="v1"  style="margin-bottom: 28px;">
         </div>`;

        datas300 += `<div class="row"> 
             <label for="v2">Alternative Investment</label>
             <input type="checkbox" class="input3" name="z2" value="2" id="v2"  style="margin-bottom: 28px;">
         </div>`;

        datas300 += `<div class="row"> 
             <label for="v3">Data Management</label>
             <input type="checkbox" class="input3" name="z3" value="3" id="v3"  style="margin-bottom: 28px;">
         </div>`;

        datas300 += `<div class="row"> 
             <label for="v4">Data Transformation</label>
             <input type="checkbox" class="input3" name="z4" value="4" id="v4"  style="margin-bottom: 28px;">
         </div>`;

        datas300 += `<div class="row"> 
             <label for="v5">Artificial Intelligence</label>
             <input type="checkbox" class="input3" name="z5" value="5" id="v5"  style="margin-bottom: 28px;">
         </div>`;

        datas300 += `<div class="row"> 
             <label for="v6">Portfolio Management Trading</label>
             <input type="checkbox" class="input3" name="z6" value="6" id="v6"  style="margin-bottom: 28px;">
         </div>`;
      }

      //This function takes a string as an input and replaces any occurrences of the search term with the replacement string
 //It then returns the modified string
 //In this case, the input string is "datascentral"
 //The search term is "{{gender}}"
 //The replacement string is "datas200"
 datascentral = datascentral
        .replace(/\{\{gender\}\}/g, datas200)
        //Replace any occurrences of "{{gender}}" in the input string with the "datas200" replacement string
        
        //Add more replace statements here
        .replace(/\{\{countryOption\}\}/g, datas)
        //Replace any occurrences of "{{countryOption}}" in the input string with the "datas" replacement string
        
        .replace(/\{\{softwaretype\}\}/g, datas300);
        //Replace any occurrences of "{{softwaretype}}" in the input string with the "datas300" replacement string
        //The modified string is returned
      res.writeHead(200, { "Content-Type": "text/html" });
      ;
      res.end(datascentral);
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

 // Serve the HTML dashboard
if (pathname === "./dashboard.html") {
  var productTitle = "";
  if (session.data.username) {
    fs.readFile('./views/dashboard.html', "utf8", async (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        try {
          // This if statement checks if the adminname is equal to the session.data.rolename
   if (adminname === session.data.rolename) {
            // Get all clients count from the database
            AllClientCount = await pool.execute(`SELECT COUNT(id) as count
FROM users
WHERE role_id = 2;`);

            // Get all vendors count from the database
            AllvendorCount = await pool.execute(`SELECT COUNT(id) as count
FROM company ;`);

            // Get all products count from the database
            AllProductCount = await pool.execute(`SELECT COUNT(id) as count
FROM product ;`);

            // Get all clients count created today
            AllClientCountToday =
              await pool.execute(`SELECT COUNT(id)  as count
FROM users
WHERE role_id = 2 AND MONTH(created_at)=${month} and DAY(created_at)=${day} and YEAR(created_at) = ${year};`);
            
            // Get all vendors count created today
            AllvendorCountToday =
              await pool.execute(`SELECT COUNT(id) as count
FROM company where MONTH(created_at)=${month} and DAY(created_at)=${day} and YEAR(created_at) = ${year};`);

            // Get all products count created today
            AllProductCountToday =
              await pool.execute(`SELECT COUNT(id) as count
FROM product where MONTH(created_at)=${month} and DAY(created_at)=${day} and YEAR(created_at) = ${year};`);

            console.log("AllProductCountToday.........");
          
          } else {
            // Asynchronously execute the query to get the data we need
  const [rows, fields] = await pool.execute(
              // This query selects the required data from the product and company tables
              `SELECT DISTINCT c.website,p.Cloud_type,p.name,p.last_reviewed_Date,DATE_FORMAT(p.created_at,'%Y-%m-%d') as created_at,p.next_review_Date,p.financial_services_client_types,c.name as cname,p.Id,GROUP_CONCAT(pt.name) as concatenated_names FROM product as p INNER JOIN company as c ON p.Company_id = c.id INNER JOIN product_product_type as ppt ON ppt.product_id = p.id  INNER JOIN product_type as pt ON pt.id = ppt.product_type_id WHERE p.Company_id = ? GROUP BY
                        c.website,
                        p.Cloud_type,
                        p.name,
                        p.last_reviewed_Date,
                        p.next_review_Date,
                        p.financial_services_client_types,
                        c.name,
                        p.Id ORDER BY p.created_at DESC;`,
              // Pass the session data id as a parameter to the query
              [session.data.id]
            );
            // Assign the rows returned from the query to a variable
            rowgotten = rows;
            // Set the productTitle variable to "My Products"
            productTitle = "My Products";
          }
         
          if (adminname === session.data.rolename) {
            //build dashboard realtime insight card
            productslists += ` <div class="background-land">
             <a href=" ./viewclientlist.html?qty=all " style="width: 24%; text-decoration:none">  <div class="styled-box"  style="position: relative; margin: 20px;">
          

               <div class="row2" style="margin-bottom: 10px;">
                    <div class="col2">All client</div>
                  </div>
                  <div>${AllClientCount[0][0].count}</div>
                </div></a>
      
                <a href="./viewvendorlist.html?qty=all" style="width: 24%;text-decoration:none">  <div class="styled-box"  style="position: relative; margin: 20px;">
             
                  <div class="row2" style="margin-bottom: 10px;">
                    <div class="col2">All Vendor</div>
                    
                  </div>
                  <div>${AllvendorCount[0][0].count}</div>
                </div></a>
             
                <a href="./viewproductlist.html?qty=all"style="width: 24%;text-decoration:none">   <div class="styled-box"  style="position: relative; margin: 20px;">
             
                <div class="row2" style="margin-bottom: 10px;">
                  <div class="col2">All Product</div>
                  
                </div>
                <div>${AllProductCount[0][0].count}</div>
              </div></a>
              <a href="./viewproductlist.html?qty=today" style="width: 24%;text-decoration:none">  <div class="styled-box"  style="position: relative; margin: 20px;">
             
                <div class="row2" style="margin-bottom: 10px;">
                  <div class="col2">Today Product</div>
                  
                </div>
                <div>${AllProductCountToday[0][0].count}</div>
              </div>
            </div></a>
           
              <div class="background-land">
            
              <a href="./viewclientlist.html?qty=today"style="width: 24%;text-decoration:none"> <div class="styled-box"  style="position: relative; margin: 20px;">
             
            <div class="row2" style="margin-bottom: 10px;">
              <div class="col2">Today Client</div>
              
            </div>
            <div>${AllClientCountToday[0][0].count}</div>
          </div></a>
       
          <a href="./viewvendorlist.html?qty=today"style="width: 24%;text-decoration:none">  <div class="styled-box"  style="position: relative; margin: 20px;">
             
          <div class="row2" style="margin-bottom: 10px;">
            <div class="col2">Today Vendor</div>
            
          </div>
          <div>${AllvendorCountToday[0][0].count}</div>
        </div></a>
      </div>`;
          } else {
            //build product card
            productslists += `<div class="styled-box">
              <h3 class="box-heading">${productTitle}</h3><div> <table  class="table table-striped table-hover" style="width: 100%;">
           
              <thead>
                <tr>
                 
                  <th scope="col">Software Name </th>
                  <th scope="col">category of Software</th>
                  <th scope="col">company</th>
                  <th scope="col">Date Added</th>
                  <th scope="col">Last Reviewed Date</th>
                  <th scope="col">Next Reviewed Date</th>
                
                  <th scope="col"></th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>`;
              if (rowgotten.length < 1) {
                productslists += "<tr><td>no data available</tr></td>";
              }else{
            for (let result of rowgotten) {

              
              productslists += ` <tr> <td> ${result.name}</td>
                <td>${result.concatenated_names}</td>
                <td>${result.cname}</td>
                <td>${result.created_at}</td>
                <td>${result.last_reviewed_Date}</td>
                <td>${result.next_review_Date}</td>
                
                <td><a href="./product.html?id=${result.Id}" > View Details</a></td> 
               
              </tr>`;
            }
          }
            productslists += `</tbody></div></div>`;
          }

          datas = data
            .replace(/\{\{navbar\}\}/g, navbar1)
            .replace(/\{\{fullname\}\}/g, session.data.fullname)
            .replace(/\{\{rolename\}\}/g, session.data.rolename)
            .replace(/\{\{productlists\}\}/g, productslists);

          res.writeHead(200, { "Content-Type": "text/html" });

          console.log("dashboardpost1......");
          res.write(datas);
          res.end();
        } catch (error) {
          console.error("Error accessing image file:", error);
          jj1 = false; // Set jj1 to false if there was an error accessing the file
        }
      }
    });
  } else {
    res.writeHead(302, {
      "Content-Type": "text/html",
      Location: host1 + "/views/login.html",
    });
    console.log("dashboardpost2......");
    res.end();
  }
}

 
 // Serve the HTML vendorprofile
    if (pathname === "./vendorprofile.html") {
      fs.readFile('./views/vendorprofile.html', "utf8", async (err, data) => {
        // If there was an error, return a 500 Internal Server Error
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        } else {
          try {
            // Get the company data from the database
            const [rows, fields] = await pool.execute(
              `SELECT  * FROM company WHERE id = ?`,
              [q.query.id]
            );
            console.log(rows);
            console.log(rows.length);
            console.log("rows.......");
            // If the company data was found, replace the placeholders in the template with the data
            if (rows[0].id) {
              for (let r of rows) {
                datas = data
                  .replace(/\{\{navbar\}\}/g, navbar1)
                  .replace(/\{\{companyname\}\}/g, r.name)
                  .replace(/\{\{companyemail\}\}/g, r.email)
                  .replace(/\{\{website\}\}/g, r.website)
                  .replace(/\{\{established\}\}/g, r.year_established)
                  .replace(/\{\{countries\}\}/g, r.location_countries)
                  .replace(/\{\{cities\}\}/g, r.location_cities)
                  .replace(/\{\{phone\}\}/g, r.Phone_no)
                  .replace(/\{\{employees\}\}/g, r.number_of_employees)
                  .replace(/\{\{address\}\}/g, r.address)
                  .replace(/\{\{id\}\}/g, r.id).replace(/\{\{alerted\}\}/g, session.alerted);
              }
            }

            // Return the modified template with the replaced placeholders
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(datas);
            res.end();
          } catch (error) {
            // If there was an error accessing the file, log the error and set jj1 to false
            console.error("Error accessing image file:", error);
            jj1 = false; // Set jj1 to false if there was an error accessing the file
          }
        }
      });
    }

 // Serve the HTML updatevendor
    if (pathname === "./updatevendor.html") {
      fs.readFile('./views/updatevendor.html', "utf8", async (err, data) => {
        // If there was an error, send a 500 Internal Server Error
        if (err) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        } else {
          try {
            // Execute the query to get the company details from the database
            const [rows, fields] = await pool.execute(
              `SELECT  * FROM company WHERE id = ?`,
              [q.query.id]
            );
            console.log(rows);
            console.log(rows.length);
            console.log("rows.......");
            // If there are any rows, replace the placeholders in the data with the company details
            if (rows.length > 0) {
              for (let r of rows) {
                datas = data
                  .replace(/\{\{navbar\}\}/g, navbar1)
                  .replace(/\{\{companyname\}\}/g, r.name)
                  .replace(/\{\{companyemail\}\}/g, r.email)
                  .replace(/\{\{website\}\}/g, r.website)
                  .replace(/\{\{established\}\}/g, r.year_established)
                  .replace(/\{\{countries\}\}/g, r.location_countries)
                  .replace(/\{\{cities\}\}/g, r.location_cities)
                  .replace(/\{\{phone\}\}/g, r.Phone_no)
                  .replace(/\{\{employees\}\}/g, r.number_of_employees)
                  .replace(/\{\{address\}\}/g, r.address)
                  .replace(/\{\{id\}\}/g, r.id);
              }
            // Otherwise, just set the productslists to a message that no sales have been made yet
            } else {
              productslists = "no sales made yet";
            }

            // Send a 200 OK response with the updated data
            res.writeHead(200, { "Content-Type": "text/html" });

            // Send the updated data to the browser
            res.write(datas);
            console.log(datas);
            console.log("edit o............");
            res.end();
          } catch (error) {
            // If there was an error, log it and set jj1 to false
            console.error("Error accessing image file:", error);
            jj1 = false; // Set jj1 to false if there was an error accessing the file
          }
        }
      });
    }
  // Serve the HTML view viewvendorlist list
  if (pathname === "./viewvendorlist.html") {
    fs.readFile('./views/viewvendorlist.html', "utf8", async (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        if (adminname === session.data.rolename) {
         
          // Check if the query qty is "today"
            if(q.query.qty == "today"){
            // If so, execute the query to get the active, id, name, location_countries, website, and created_at of the company, filtered by the current date, and order it by descending created_at
              const [rows, fields] =
              await pool.execute(`SELECT active,id,name,location_countries,website,DATE_FORMAT(created_at,'%Y-%m-%d') as created_at FROM company WHERE MONTH(created_at)=${month} and DAY(created_at)=${day} and YEAR(created_at) = ${year} ORDER BY created_at DESC`);
                                          rowgotten = rows;
            }else{
              // If not, execute the query to get the active, id, name, location_countries, website, and created_at of the company, and order it by descending created_at
              const [rows, fields] =
              await pool.execute(`SELECT active,id,name,location_countries,website,DATE_FORMAT(created_at,'%Y-%m-%d') as created_at FROM company ORDER BY created_at DESC;`);
              rowgotten = rows;
            }

        } else {
          const [rows, fields] = await pool.execute(
            `SELECT active,id,name,location_countries,website,DATE_FORMAT(created_at,'%Y-%m-%d') as created_at FROM company WHERE id = ? ORDER BY created_at DESC;`,
            [session.data.id]
          );
          rowgotten = rows;
        }
        // If the length of rowgotten is less than 1, then add a table row with "no data available" as the text
 if (rowgotten.length < 1) {
          productslists += "<tr><td>no data available</tr></td>";
        } else {
          // Loop through the results in rowgotten
          for (var result of rowgotten) {
            // Add a table row with the result information
            productslists += ` <tr> <td> ${result.name}</td>
              <td>${result.location_countries}</td>
              <td><a href="${result.website}" target="_blank">${result.website}</a></td>
              <td>${result.created_at}</td>
              <td>${result.active == 1?true:false}</td>
              <td><a href="./vendorprofile.html?id=${result.id}" > View Details</a></td>
              <td><a href="./deactivatevendor?id=${result.id}" > Deactivate vendor</a></td>
              <td><a href="./activatevendor?id=${result.id}" > Activate vendor</a></td>
            </tr>
            `;
          }
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        datas = data
          .replace(/\{\{navbar\}\}/g, navbar1)
          .replace(/\{\{vendorlist\}\}/g, productslists) .replace(/\{\{alerted\}\}/g, session.alerted);;
        res.end(datas);
      }
    });
  }

  // Serve the HTML view viewclientlist list
  if (pathname === "./viewclientlist.html") {
    fs.readFile('./views/viewclientlist.html', "utf8", async (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // Check if the query quantity is "today"
  if(q.query.qty == "today"){
        // Execute the query, selecting the concatenated names, email, firstname, lastname, lastname, active, name, gender, id, and created_at of users
        const [rows, fields] =
          await pool.execute(`SELECT GROUP_CONCAT(pt.name)  as concatenated_names,u.email,u.firstname,u.lastname,u.lastname,u.active,c.name,u.gender,u.id,DATE_FORMAT(u.created_at,'%Y-%m-%d') as created_at FROM users as u INNER JOIN user_product_type_choice as uppt ON uppt.user_id = u.id INNER JOIN country as c ON u.country_id = c.id  INNER JOIN product_type as pt ON pt.id = uppt.product_type_id WHERE u.role_id > 1 AND MONTH(u.created_at)=${month} and DAY(u.created_at)=${day} and YEAR(u.created_at) = ${year} GROUP BY
                                      u.email,
                                      u.id ORDER BY u.created_at DESC`);
        // Store the rows in the rowgotten variable
        rowgotten = rows;

        }else{
          // Execute the query, selecting the concatenated names, email, firstname, lastname, lastname, active, name, gender, id, and created_at of users
          const [rows, fields] =
          await pool.execute(`SELECT GROUP_CONCAT(pt.name)  as concatenated_names,u.email,u.firstname,u.lastname,u.lastname,u.active,c.name,u.gender,u.id,DATE_FORMAT(u.created_at,'%Y-%m-%d') as created_at FROM users as u INNER JOIN user_product_type_choice as uppt ON uppt.user_id = u.id INNER JOIN country as c ON u.country_id = c.id  INNER JOIN product_type as pt ON pt.id = uppt.product_type_id WHERE u.role_id > 1 GROUP BY
                                      u.email,
                                      u.id ORDER BY u.created_at DESC`);
        // Store the rows in the rowgotten variable
        rowgotten = rows;

        }
        console.log(rowgotten[0]);
        console.log('rowgotten[0]........,ooo');
        if (rowgotten.length < 1) {
          productslists += "<tr><td>no data available</tr></td>";
        } else {
          for (var result of rowgotten) {
            
            // append the data to the productslist variable
            productslists += ` <tr> <td> ${result.firstname} ${result.lastname}</td>
      <td> ${result.name}</td>
      <td>${result.email}</td>
      <td>${result.gender}</td>
      <td>${result.created_at}</td>

      <td>${result.concatenated_names}</td>
      <td>${result.active == 1?true:false}</td>
      <td><a href="./profile.html?id=${result.id}" > View Details</a></td>
            <td><a href="./deactivateclient?id=${result.id}" > Deactivate Client</a></td>
            <td><a href="./activateclient?id=${result.id}" >Activate Client</a></td>
    </tr>
    `;
          }
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        datas = data
          .replace(/\{\{navbar\}\}/g, navbar1)
          .replace(/\{\{clientlist\}\}/g, productslists) .replace(/\{\{alerted\}\}/g, session.alerted);
        res.end(datas);
      }
    });
  }

  // Serve the method for deactivatevendor
  if (pathname === "./deactivatevendor") {
    fs.readFile("./views/index.html", "utf8", async (err, data) => {
      // If there is an error
      if (err) {
        // Get the alert cookie with a 0 parameter to indicate an error
        getAlertCookie(0, "Vendor have not deactivated successfully",res);
        // Set the response header to 500 and end with an internal server error
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // If there is an ID in the query
        if (q.query.id) {
          // Log the ID to the console
          console.log(q.query.id);
          // Log a string to the console
          console.log("deleteproduct..........");
          // Create a SQL query to update the company table setting the active column to false where the ID matches the query
          sql = `UPDATE company SET active = false
         WHERE id = ${mysql.escape(q.query.id)}`;
          // Execute the SQL query
          await pool.execute(sql);
        // Get the alert cookie with a 1 parameter to indicate success
        getAlertCookie(1, "Vendor have been deactivated successfully",res);

          // Set the response header to 302, with a location header to redirect the user to the viewvendorlist.html page
          res.writeHead(302, {
            "Content-Type": "text/html",
            Location: host1 + "/viewvendorlist.html",
          });
          // End the response
          res.end();
        }
      }
    });
  }
  // Serve the method for activatevendor
  if (pathname === "./activatevendor") {
    fs.readFile("./views/index.html", "utf8", async (err, data) => {
      if (err) {
        // If there is an error, show an alert cookie and return a 500 error
        getAlertCookie(0, "Vendor have not deactivated successfully",res);

        // Send the 500 error response
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // If there is an ID in the query, delete the product
        if (q.query.id) {
          console.log(q.query.id);
          console.log("deleteproduct..........");
          // Build the SQL query to delete the product
          sql = `UPDATE company SET active = true
         WHERE id = ${mysql.escape(q.query.id)}`;
          // Execute the SQL query
          await pool.execute(sql);
          // If the product was deleted, show an alert cookie and return a 302 redirect
          getAlertCookie(1, "Vendor have been activated successfully",res);

          // Send the 302 redirect response
          res.writeHead(302, {
            "Content-Type": "text/html",
            Location: host1 + "/viewvendorlist.html",
          });
          res.end();
        }
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
  

  // Serve the method for register posting
if (pathname === "./register.html") {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      // Parse form data (e.g., using querystring module)
      const formData = new URLSearchParams(body);
      const email = formData.get("email");
      if (formData.get("type") === "client") {
        // Extract form fields
        const username = formData.get("username");
        const firstname = formData.get("firstname");
        const lastname = formData.get("lastname");
        const address = formData.get("address");
        const gender = formData.get("gender");
        const dateofbirth = formData.get("dateofbirth");
        const country_id = parseInt(formData.get("country"));
        const phonenumber = formData.get("phonenumber");
        const password = formData.get("password");
        const role_id = client;
        const active = true;

        // Process registration data (e.g., save to database)
        sql =
          "INSERT INTO users (username,email,firstname,lastname,address,gender,dateofbirth,country_id,phonenumber,password,role_id,active) VALUES ?";
        values = [
          [
            `${username}`,
            `${email}`,
            `${firstname}`,
            `${lastname}`,
            `${address}`,
            `${gender}`,
            `${dateofbirth}`,
            country_id,
            `${phonenumber}`,
            `${password}`,
            role_id,
            active,
          ],
        ];

         // Use the pool.query method to execute an SQL query
      const [rows1, fields1] = await pool.query(sql, [values]);

      // Log a message to the console
      console.log("reg inserted");
      }
      // If the type of the form is "vendor"
        if (formData.get("type") === "vendor") {
            // Get the name of the company
            const name = formData.get("Companyname");
            // Set the field name to the company name
            fieldername = formData.get("Companyname");
            // Get the website of the company
            const website = formData.get("website");
            // Get the countries where the company is located
            const location_countries = formData.get("countries");
            // Get the address of the company
            const address = formData.get("address");
            // Get the cities where the company is located
            const location_cities = formData.get("cities");
            // Get the year the company was established
            const year_established = formData.get("established");
            // Get the number of employees in the company
            const number_of_employees = parseInt(formData.get("employees"));
            // Get the phone number of the company
            const Phone_no = formData.get("telephone");
            // Get the password of the company
            const password = formData.get("password");
            // Get the role ID of the company
            const role_id = vendor;
            // Set the active status of the company to true
            const active = true;
        // Process registration data (e.g., save to database)
        sql =
          "INSERT INTO company (name,email,website,location_countries,address,location_cities,year_established,number_of_employees,Phone_no,password,role_id,active) VALUES ?";
        // This function is used to insert a new company into the database
//  async function insertNewCompany(values, email, password, role_id, active) {
 // Assign the values array to the variables
 values = [
          [
            `${name}`,
            `${email}`,
            `${website}`,
            `${location_countries}`,
            `${address}`,
            `${location_cities}`,
            `${year_established}`,
            number_of_employees,
            `${Phone_no}`,
            `${password}`,
            role_id,
           // Assign the active parameter to the active variable
             active,
          ],
        ];
        console.log(values);
        console.log("company........");
    

      // Use the pool.query method to execute an SQL query
      const [rows1, fields1] = await pool.query(sql, [values]);

      // Log a message to the console
      console.log("reg inserted");

      // Use the pool.execute method to execute an SQL query
      const [rows, fields] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      for (let result of rows) {
        idDatas += result.id;
        console.log("id: ", idDatas);
      }
      let producttypename='';
      for (var form of formData.keys()) {
        // loop through each key in the formData object
        if (form.charAt(0) === "z") {
          // check if the key starts with a 'z'
          var sqld =
            "INSERT INTO user_product_type_choice (product_type_id,user_id,active) VALUES ?";
           // sql query to insert data into the user_product_type_choice table
           let producttype = formData.get(form)
          // get the value of the key
          let producttypeid = parseInt(producttype.split('_')[0]);

           // extract the product type name from the key
          producttypename += `${producttype.split('_')[1]}, `;
         // add the product type name to the producttypename variable
          let user_id = parseInt(idDatas);
          // get the user_id from the idDatas variable
          var values2 = [[producttypeid, user_id, true]];
          // create an array to store the data to be inserted
          console.log("choice: ", values2);

          const [rows, fields] = await pool.query(sqld, [values2]);
          // insert the data into the user_product_type_choice table
          console.log("choice inserted");
        }
      }
    
 
    } }catch (error) {
    
      console.error("Error executing query:", error);
    }
  });

  res.writeHead(302, {
    "Content-Type": "text/html",
    Location: host1 + "/login.html",
  });
  res.end();
}

  // Serve the method for editprofile posting
if (pathname === "./editprofile.html") {
  let body = "";
  let universalId = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      // Parse form data (e.g., using querystring module)
      const formData = new URLSearchParams(body);
      const email = formData.get("email");
      const id = parseInt(formData.get("id"));
      universalId = formData.get("id");
      console.log(universalId);
      console.log("universalId22222.....");
      // Extract form fields
      const username = formData.get("username");
      const firstname = formData.get("firstname");
      const lastname = formData.get("lastname");
      const address = formData.get("address");
      const gender = formData.get("gender");
      const dateofbirth = formData.get("dateofbirth");
      const country_id = parseInt(formData.get("country"));
      const phonenumber = formData.get("phonenumber");

      
      // Process registration data (e.g., save to database)
      // Escape all the user input fields
      sql = `UPDATE users SET username = ${mysql.escape(
        username
      )}, email = ${mysql.escape(email)}, firstname = ${mysql.escape(
        firstname
      )}, lastname = ${mysql.escape(lastname)}, address = ${mysql.escape(
        address
      )}, gender = ${mysql.escape(gender)}, dateofbirth = ${mysql.escape(
        dateofbirth
      )}, country_id = ${mysql.escape(
        country_id
      )}, phonenumber = ${mysql.escape(
        phonenumber
      )} WHERE id = ${mysql.escape(id)}`;

      // Execute the query
      const [rows1, fields1] = await pool.query(sql);

      // Loop through the form data keys
      for (var key of formData.keys()) {
        if (/^z\d/.test(key)) {
          // Key matches the pattern
          console.log(`Key '${key}' matches the pattern`);
          // Delete the user product type choice
          await pool.query(
            "delete from user_product_type_choice where user_id=?",
            [id]
          );
          break;
        }
      }
      // loop through the form data keys
  for (var form of formData.keys()) {
        // check if the form starts with 'z'
      if (form.charAt(0) === "z") {
        // create a sql query
        var sqld =
          "INSERT INTO user_product_type_choice (product_type_id,user_id,active) VALUES ?";
        // parse the form data to an integer
        let pci = parseInt(formData.get(form));
        // get the user id
        let ui = id;
        // create an array of values to insert into the database
        var values2 = [[pci, ui, true]];
        console.log("choice: ", values2);

        // execute the query with the values
        const [rows, fields] = await pool.query(sqld, [values2]);

        console.log("choice inserted");
      }
      // set the alert cookie
      getAlertCookie(1, "User have been updated successfully", res);

      // log out the user
      //await user.logout(req, res, next);
  }
    } catch (error) {
      getAlertCookie(0, "User have not updated successfully", res);

      console.error("Error executing query:", error);
    }
    console.log(universalId);
    console.log("universalId1111.....");
    res.writeHead(302, {
      "Content-Type": "text/html",
      Location: host1 + `/profile.html?id=${universalId}`,
    });
    res.end();
  });
}

// Serve the method for login posting
if (pathname === "./login.html") {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      
      // Parse the form data to get the email and password, and role_id
      const formData = new URLSearchParams(body);

      const email = formData.get("email");

      const password = formData.get("password");
      const role_id = formData.get("role_id");
      // If the role_id is equal to the vendor's role_id, then the user is a vendor
      if (formData.get("role_id") === vendor.toString()) {
        
        // Build the SQL query for the company table
        sql =
          "SELECT * FROM company WHERE email = ? and password = ? and role_id = ? and active = true";
        values = [email, password, role_id];
      } else {
        // Build the SQL query for the users table
        sql =
          "SELECT * FROM users WHERE email = ? and password = ? and role_id = ? and active = true";
        values = [email, password, role_id];
      }
      // Execute the query and get the results
      const [rows, fields1] = await pool.query(sql, values);
      // If there are no results, the user's email and password are incorrect
      if (rows.length < 1) {
        console.log("tadadadadada");

        // Send an alert cookie to the user
        getAlertCookie(0, "User have not logged in successfully", res);
       
        res.writeHead(302, {
          "Content-Type": "text/html",
          Location: host1 + "/login.html",
        });
        res.end();
      } else {
        
        //If the sessionId does not exist, assign it the sessionId2
        if (!session.sessionId) {
          session.sessionId = sessionId2;
        }
        //Declare a variable to store the role name
        let rolenm = 0;

        //Check if the role_id is equal to admin
       if (rows[0].role_id == admin) {
          //Assign the role name to adminname
          rolenm = adminname;
        } else {
          //Assign the role name to vendorname
          rolenm = vendorname;
        }

        //Assign the values to the cookie
        var cooked = `hhh#ll!sessionId#${session.sessionId}!sessionu#${
          rows[0].username || rows[0].name
        }!sessionf#${rows[0].firstname || rows[0].name} ${
          rows[0].lastname || " "
        }!sessioni#${rows[0].id}!sessionri#${
          rows[0].role_id
        }!sessionrn#${rolenm}`;

        //Set the cookie
        res.setHeader(
          "Set-Cookie",
          `session=${cooked} ;Path=/;Max-Age=3600 ; HttpOnly`
        );
        //Set the alert cookie
        getAlertCookie(1, "User have been logged in successfully", res);

        
        //Log the cooked value to the console
        console.log(cooked);
        console.log("cooked.......");

        res.writeHead(302, {
          "Content-Type": "text/html",
          Location: host1 + "/dashboard.html",
        });
        console.log("loginpost......");

        res.end();
      }
    } catch (error) {
      console.error("Error executing query:", error);
    }
  });
}

// Serve the method for updatevendor posting
if (pathname === "./updatevendor.html") {
  let body = "";
  let universalId = "";

  // Listen for data chunks incoming from the server
  req.on("data", (chunk) => {
    // Add the chunk to the body accumulator
    body += chunk.toString();
  });

  // Once all data has been received, process it
  req.on("end", async () => {
    try {
      // Parse form data (e.g., using querystring module)
      const formData = new URLSearchParams(body);
      const email = formData.get("email");
      const id = parseInt(formData.get("id"));
      universalId = formData.get("id");

      // Get form data
      const name1 = formData.get("companyname");
      const website = formData.get("website");
      const location_countries = formData.get("countries");
      const address = formData.get("address");
      const location_cities = formData.get("cities");
      const year_established = formData.get("established");
      const number_of_employees = parseInt(formData.get("employees"));
      const Phone_no = formData.get("telephone");

      // Process registration data (e.g., save to database)
     // UPDATE the company's information in the database
 sql = `UPDATE company SET name = ${mysql.escape(
        name1
      )}, email = ${mysql.escape(email)}, website = ${mysql.escape(
        website
      )}, location_countries = ${mysql.escape(
        location_countries
      )}, address = ${mysql.escape(
        address
      )}, location_cities = ${mysql.escape(
        location_cities
      )}, year_established = ${mysql.escape(
        year_established
      )}, number_of_employees = ${mysql.escape(
        number_of_employees
      )}, Phone_no = ${mysql.escape(Phone_no)} WHERE id = ${mysql.escape(
        id
      )}`;
    
      console.log(values);
      console.log("company........");

      // query the database with the given SQL statement
      const [rows1, fields1] = await pool.query(sql);
      // Update the company's information successfully
      getAlertCookie(1, "Vendor have been updated successfully", res);

    } catch (error) {
      // Update the company's information failed
      getAlertCookie(0, "Vendor have not updated successfully", res);

      console.error("Error executing query:", error);
    }

    res.writeHead(302, {
      "Content-Type": "text/html",
      Location: host1 + `/vendorprofile.html?id=${universalId}`,
    });
    res.end();
  });
}


// Serve the method for addproduct posting
if (pathname === "./addproduct.html") {
  let body = "";

  // Listen for data chunks arriving from the server
  req.on("data", (chunk) => {
    // Append the chunk to the body
    body += chunk.toString();
  });
  // Log the __dirname
  console.log(__dirname);
  // Log the __dirname
  console.log("__dirname");
  // Log the process.cwd()
  console.log(process.cwd());
  // Log the process.cwd()
  console.log("process.cwd()");
  // Listen for the end of the request
  req.on("end", async () => {
    try {
      // Create a new URLSearchParams object from the body
      const formData = new URLSearchParams(body);

      // Get the software name from the form data
      const name = formData.get("softwarename");
      // Get the business areas from the form data
      const business_areas = formData.get("businessareas");
      // Get the description from the form data
      const description = formData.get("description");
      // Get the additional information from the form data
      const additionalinformation = formData.get("additionalinformation");
      // Get the modules from the form data
      const modules = formData.get("modules");
      // Get the financial services client types from the form data
      const financial_services_client_types = formData.get(
        "financialservicesclientypes"
      );
      // Get the cloud type from the form data
      const Cloud_type = formData.get("cloud");
      // Set the active flag to true
      const active = true;
      // Get the Company ID from the session data
      const Company_id = session.data.id;

      // Process registration data (e.g., save to database)last_reviewed_Date,
      sql =
        "INSERT INTO product (name,business_areas,description,additional_info,modules,financial_services_client_types,Cloud_type,last_reviewed_Date,next_review_Date,Company_id,active) VALUES ?";
      values = [
        [
          `${name}`,
          `${business_areas}`,
          `${description}`,
          `${additionalinformation}`,
          `${modules}`,
          `${financial_services_client_types}`,
          `${Cloud_type}`,
          `1960-01-01`,
          `${formattedDate2}`,
          `${Company_id}`,
          active,
        ],
      ];
      console.log(formData.get("softwarename"));
    
      const [rows1, fields1] = await pool.query(sql, [values]);

      var productidgotten = await new Promise((resolve, reject) => {
        if (rows1.affectedRows < 1) {
          // console.log("tadadadadadapppppp");
          // console.log("rows1.affectedRows = " + rows1.affectedRows);
          reject("tadadadadadapppppperr");
          res.writeHead(302, {
            "Content-Type": "text/html",
            Location: host1 + "/views/addproduct.html",
          });
          res.end();
        } else {
          // console.log(rows1);
          // console.log("product inserted");
          resolve(rows1.insertId);
        }
      });

      console.log(productidgotten);
    

      // console.log("fielder.keys()............");
      for (var form of formData.keys()) {
        // console.log("form = " + form);
        if (form.charAt(0) === "z") {
          var sqld =
            "INSERT INTO product_product_type (product_type_id,product_id,active) VALUES ?";
          let pci = parseInt(formData.get(form));
          var values2 = [[pci, productidgotten, true]];
          console.log("product product inserted values: ", values2);

          const [rows, fields] = await pool.query(sqld, [values2]);

          console.log("product product inserted");
        }
      }
    

      getAlertCookie(1, "Product have been added successfully", res);

      res.writeHead(302, {
        "Content-Type": "text/html",
        Location: host1 + "/viewproductlist.html",
      });
      console.log("loginpost......");

      res.end();
    } catch (error) {
      getAlertCookie(0, "Product have not added successfully", res);

      console.error("Error executing query:", error);
    }
  });
}

// Serve the method for editproduct posting
if (pathname === "./editproduct.html") {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  console.log(__dirname);
  console.log("__dirname");
  console.log(process.cwd());
  console.log("process.cwd()");
  req.on("end", async () => {
    try {
      // Create a new URLSearchParams object to store the body of the request
 const formData = new URLSearchParams(body);
      // Get the value of the "softwarename" parameter and store it in the email variable
      const email = formData.get("softwarename");
      // Get the value of the "id" parameter and store it in the id variable
      const id = parseInt(formData.get("id"));
      // Store the value of the "id" parameter in the universalId variable
      universalId = formData.get("id");

      // Get the values of the remaining parameters and store them in their respective variables
      const name = formData.get("softwarename");
      const business_areas = formData.get("businessareas");
      const description = formData.get("description");
      const additionalinformation = formData.get("additionalinformation");
      const modules = formData.get("modules");
      const financial_services_client_types = formData.get(
        "financialservicesclientypes"
      );
      const Cloud_type = formData.get("cloud");

      // Escape all the values with mysql.escape() to prevent sql injection
      sql = `UPDATE product SET name = ${mysql.escape(
        name
      )}, business_areas = ${mysql.escape(
        business_areas
      )}, description = ${mysql.escape(
        description
      )}, additional_info = ${mysql.escape(
        additionalinformation
      )}, modules = ${mysql.escape(
        modules
      )}, financial_services_client_types = ${mysql.escape(
        financial_services_client_types
      )}, Cloud_type = ${mysql.escape(
        Cloud_type
      )} WHERE id = ${mysql.escape(id)}`;

      // Execute the query and store the results in rows1 and fields1
      const [rows1, fields1] = await pool.query(sql, [values]);

      // Log the message
      console.log("fielder.keys()............");
      // Loop through the formData keys
      for (var key of formData.keys()) {
        // Test the key against the pattern
        if (/^z\d/.test(key)) {
          // Key matches the pattern
          console.log(`Key '${key}' matches the pattern`);
          // Execute the delete query
          await pool.query(
            "delete from product_product_type where product_id=?",
            [id]
          );
          // Break the loop
          break;
        }
      }
      // loop through the form data keys
  for (var form of formData.keys()) {
        // check if the first character of the key is 'z'
      if (form.charAt(0) === "z") {
        // variable to store the SQL query
        var sqld =
          "INSERT INTO product_product_type (product_type_id,product_id,active) VALUES ?";
        // variable to store the product_type_id
        let pci = parseInt(formData.get(form));
        // variable to store the values to be inserted
        var values2 = [[pci, id, true]];
        // log the values to be inserted
        console.log("product product inserted values: ", values2);

        // execute the query, passing in the SQL query and the values
        const [rows, fields] = await pool.query(sqld, [values2]);

        // log that the query has been executed
        console.log("product product inserted");
      }
     
      // set the location header in the response
      res.writeHead(302, {
        "Content-Type": "text/html",
        Location: host1 + `/product.html?id=${universalId}`
      });
      console.log("loginpost......");

      // end the response
      res.end();
    } }catch (error) {
      getAlertCookie(0, "Product have not updated successfully", res);

      console.error("Error executing query:", error);
    }
  });
}

if (pathname === "./editproductdocument.html") {
  let body = "";

  // This function is used to process the request
  req.on("data", (chunk) => {
    // Add the chunk to the body
    body += chunk.toString();
  });
  console.log(__dirname);
  console.log("__dirname");
  console.log(process.cwd());
  console.log("process.cwd()");

  var form = new formidable.IncomingForm();

  // async function that returns a Promise
var result = await new Promise((resolve, reject) => {
    // parsing the request to get fields and files
    form.parse(req, (err, fields, files) => {
      // if there is an error, reject the promise
      if (err) {
        reject(err);
      // else, resolve the promise with the fields and files
      } else {
        resolve({ fields, files });
      }
    });
  });
  // logging the result
  console.log(result);
  // logging a string
  console.log("jjj..........");
  // async function that returns a Promise
  var keyspdf = await new Promise((resolve, reject) => {
    // if there are fields or files in the result
    if (result.fields || result.files) {
      // storing the fields and files in variables
      fielder = result.fields;
      filer = result.files;
      // getting the keys of the files
      const fil = Object.keys(filer);
      // logging the keys
      console.log(fil);
      // logging a string
      console.log("jjj.jhk.........");
      // resolving the promise with the keys of the files
      resolve(Object.keys(fil));
    } else {
      // rejecting the promise with an error
      throw "error";
    }
  });

  if (keyspdf.length > 0) {
    const base64Stringpdfkk = await new Promise((resolve, reject) => {
      if (filer.pdf[0].filepath) {
        resolve(fs.readFileSync(filer.pdf[0].filepath));
      } else {
        reject("err");
      }
    });

    base64Stringpdf = base64Stringpdfkk.toString("base64");

    await new Promise((resolve, reject) => {
      fs.unlink(filer.pdf[0].filepath, function (err) {
        if (err) {
          reject(err);
        } else {
          console.log("pdf deleted!");
          resolve("pdf deleted!");
        }
      });
    });
  }

  try {
    let idOfPdf = parseInt(fielder.id);
    console.log(idOfPdf);
    console.log("idOfPdf.....");

    sql = `UPDATE product SET pdf = ${mysql.escape(
      base64Stringpdf
    )} WHERE id = ${mysql.escape(idOfPdf)}`;

    const result3 = await new Promise((resolve, reject) => {
      if (!idOfPdf) {
        reject("rrr");
      } else {
        console.log(result.affectedRows + " record(s) updated");

        resolve(pool.query(sql));
      }
    });

    console.log(result3);
    console.log("pdf updated1!");
    if (result3.affectedRows < 1) {
      getAlertCookie(0, "Product have not updated successfully", res);

      res.writeHead(302, {
        "Content-Type": "text/html",
        Location: host1 + "/addproduct.html",
      });
      res.end();
    } else {
      console.log("pdf updated2!");
      getAlertCookie(1, "Product have been updated successfully", res);

      res.writeHead(302, {
        "Content-Type": "text/html",
        Location: host1 + `/product.html?id=${fielder.id}`,
      });
      res.end();
    }
  } catch (error) {
    getAlertCookie(0, "Product have not updated successfully", res);

    console.error("Error executing query:", error);
  }
}
// Serve the method for editproductreview posting
if (pathname === "./editproductreview.html") {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  console.log(__dirname);
  console.log("__dirname");
  console.log(process.cwd());
  console.log("process.cwd()");
  req.on("end", async () => {
    try {
      const formData = new URLSearchParams(body);
      const id = parseInt(formData.get("id"));
      universalId = formData.get("id");

      const last_reviewed_Date = formData.get("lastreview");
      const next_review_Date = formData.get("nextreview");

      // UPDATE the given product and set the last_reviewed_Date and next_review_Date to the given values
// The id of the product is given
sql = `UPDATE product SET last_reviewed_Date = ${mysql.escape(
        last_reviewed_Date
      )}, next_review_Date = ${mysql.escape(
        next_review_Date
      )} WHERE id = ${mysql.escape(id)}`;

      const [rows1, fields1] = await pool.query(sql, [values]);
      getAlertCookie(1, "Product have been updated successfully", res);

      // Send a 302 redirect to the product page with the universalId query parameter
      res.writeHead(302, {
        "Content-Type": "text/html",
        Location: host1 + `/product.html?id=${universalId}`,
      });
      // Log that the login post request was received
      console.log("loginpost......");

      res.end();
    } catch (error) {
      getAlertCookie(0, "Product have not updated successfully", res);

      console.error("Error executing query:", error);
    }
  });
}



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

//to create alert message for success and error message
async function getAlertCookie(status, message, res)  {
  var cookedcookie = "";

  //cookie code
  cookedcookie = `hhkj#llo!alertedid#${status}!alertedvalue#${message}`;

  // Assuming 'res' is the response object
  let existingCookies = res.getHeader("Set-Cookie") || [];
  existingCookies = Array.isArray(existingCookies)
    ? existingCookies
    : [existingCookies];

  // Append the new cookie to the existing cookies
  const newCookie = `alerted=${cookedcookie}; Path=/; Max-Age=1; HttpOnly`;
  existingCookies.push(newCookie);

  // Set the updated list of cookies in the response headers
  res.setHeader("Set-Cookie", existingCookies);

  return cookedcookie;
}

const port = 8080;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
