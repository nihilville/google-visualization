function getQString(name){
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Reload page every day... Evvvry Day!
setTimeout(function(){window.location.reload(1);}, 3600000);

// Variables coming from the email_dashboard.module file
var emailData = []; // [1] = delivered, [2] = total opens, [3] = total clicks, [4] = hardbounces, [5] = total failures, [6] = active mailings
var uniqueDepartments; // used to created the columns for each department line
var datesArray = [];

// Graph configuration options for each of the strongmail graphs
var strongMailOptions = {title:'Hard Bounce Rate', //options.title = "Hard Bounce Rate"; change individually
			   titleTextStyle:{fontSize:'24',},
			   width:550,
			   height:350,
			   animation:{
				   duration:700,
				   startup:true,
				   easing:'in',
			   },
			   bar:{groupWidth:"90%"},
			   vAxis:{
				   format:'percent',
				   viewWindow:{
					   max:1,
					   min:.5,
				   },
				   gridlines:{count:5},
			   },
			   hAxis:{format:'MMM dd'},
			   colors:['#ff0000','#ff7800','#dccf00','#a6dc00','#189c02','#00fda7','#0397a9','#0012fd','#9500fd'],
			   chartArea:{left:70,top:70,width:'80%'}, //width:'85%' to go the full length without the legend showing
			   legend:{position: 'none'}
};

/* Arguments:
   Title
   graph-container-id (div the graph will be drawn to)
   Formula (e.g. deliveryRate = parseInt(emailData[department][i][1])/(parseInt(emailData[department][i][1])+ parseInt(emailData[department][i][5]));
   Formula needs to be sent as string and later eval()ed, as department variable will not be instantiated until the function has run
   Additional options... only vAxis.format and vAxis.viewwindow.min differ... chart type added for bar/column charts
*/
function newGraph(title, graphId, formula, vAxisFormat, vAxisViewWindowMin, vAxisViewWindowMax, chartType){	
	// Set chart options different from the default
	strongMailOptions.title = title;
	strongMailOptions.vAxis.format = vAxisFormat;
	strongMailOptions.vAxis.viewWindow.min = vAxisViewWindowMin;
	strongMailOptions.vAxis.viewWindow.max = vAxisViewWindowMax;
	
	var graphRateArray = [];
	var graphData = new google.visualization.DataTable();
	
	// Set Columns for Graph
	graphData.addColumn('datetime', 'Date');
	jQuery.each(uniqueDepartments, function( key, value ){
		graphData.addColumn('number', value);
	});
	
	// Create the massive hunking array that's going to store the deliveryRate and data values for each department
	jQuery.each(uniqueDepartments, function( key, value ){
		var department = value.replace(/\s/g, '');
		graphRateArray.push[department];
		graphRateArray[department] = [];
		// Now fill the graph with the given formula
		for(i = 0; i < datesArray.length; i++){
			if(emailData[department].hasOwnProperty(i)){ // only if there's actual data for that day
				// for certain formulas (e.g. open rate, inconsistencies in the date that an email is open can lead to percentages over 100%... in that case, default to 100%)
				var dataPoint = eval(formula);
				if(vAxisFormat == 'percent'){
					if(eval(formula) > 1){dataPoint = 1;}
				}
				// we're also including the date here, to try to match to the date in the first column later
				graphRateArray[department][emailData[department][i].run_date] = dataPoint;
			}
		}
	});
	// Second loop, this time to process the array into the rows for the graph
	for(i = 0; i < datesArray.length; i++){
		var newDate = datesArray[i];
		newDate = newDate.replace(" ", "T") + "Z"; // internet Explorer requires us to reformat the date in ISO format to display
		// Now we can set start entering in the dates
		var newRow = [new Date(newDate)];
		newRow[0].setHours(0,0,0,0); // set date row to only measure days by setting hrs, mins, secs, msecs to zero
		jQuery.each(uniqueDepartments, function( key, value ){
			var department = value.replace(/\s/g, '');
			if(datesArray[i] in graphRateArray[department]){
				newRow.push(graphRateArray[department][datesArray[i]]);
			}else{ // if there's no data for that date, don't blow up the graphs
				newRow.push(0);
			}
		});
		graphData.addRow(newRow);
	}
	
	// Format the date and percentage used in the tooltips
	var date_formatter = new google.visualization.DateFormat({pattern: "MMM dd, yyyy"}); 
	date_formatter.format(graphData, 0);
	if(vAxisFormat == 'percent'){
		var num_formatter = new google.visualization.NumberFormat({pattern:'##.##%',}); 
		for(j = 1; j <= Object.keys(uniqueDepartments).length; j++){
			num_formatter.format(graphData, j);
		}
	}
	
	// Instantiate and draw our chart, passing in the options array
	if(chartType == "bar"){
		graphChart = new google.visualization.ColumnChart(document.getElementById(graphId));
		//graphChart = new google.charts.Bar(document.getElementById(graphId)); //This would be the one to use for the Material styled graph	
	}else{
		graphChart = new google.visualization.LineChart(document.getElementById(graphId));
	}
	graphChart.draw(graphData, google.charts.Bar.convertOptions(strongMailOptions));
}

function createGraph() {
  Drupal.behaviors.email_dashboard = {
    attach: function (context, settings) {
	  // set variables from php module file
	  emailData["foobartestemail"] = settings.email_dashboard.graphs_data_foobartestemail;
	  emailData["ConsumerShare"] = settings.email_dashboard.graphs_data_ConsumerShare;
	  emailData["ConsumerTransactional"] = settings.email_dashboard.graphs_data_ConsumerTransactional;
	  emailData["ConsumerMarketing"] = settings.email_dashboard.graphs_data_ConsumerMarketing;
	  emailData["AdvertiserTransactional"] = settings.email_dashboard.graphs_data_AdvertiserTransactional;
	  emailData["AdvertiserNotification"] = settings.email_dashboard.graphs_data_AdvertiserNotification;
	  emailData["AdvertiserReporting"] = settings.email_dashboard.graphs_data_AdvertiserReporting;
	  emailData["foobar4Schools"] = settings.email_dashboard.graphs_data_foobar4Schools;
	  emailData["PubTransactional"] = settings.email_dashboard.graphs_data_PubTransactional;
	  uniqueDepartments = settings.email_dashboard.unique_departments;
	  datesArray = settings.email_dashboard.dates_array;

	  // Load the Visualization API and the piechart package. callback ensures that drawchart is not called until packages are loaded
      google.charts.load("current", {'packages':['corechart','bar']});
      google.charts.setOnLoadCallback(drawCharts);

      // Callback that creates and populates a data table,  instantiates the line chart, passes in the data and draws it.
      function drawCharts() {
		    // First Graph, Delivery Rate ------------------- delivered/(delivered+failures)
		    newGraph('Delivery Rate', 'delivery-rate-graph', 'parseInt(emailData[department][i][1])/(parseInt(emailData[department][i][1])+ parseInt(emailData[department][i][5]))','percent',0,1,'bar');
			// Second Graph, Open Rate ---------------------- unique opened emails/delivered emails
			newGraph('Unique Open Rate', 'open-rate-graph', 'parseInt(emailData[department][i][2])/parseInt(emailData[department][i][1])','percent',0);
			// Third Graph, Active Mailings - Only graph where there is a straight number, rather than a formula leading to a percentage
			newGraph('Active Mailings', 'active-mailings-graph', 'parseInt(emailData[department][i][6])','#',0);
			// Fourth Graph, Click to Open Rate ------------- unique clicks/unique opens
			newGraph('Click to Open Rate', 'click-rate-graph', 'parseInt(emailData[department][i][3])/parseInt(emailData[department][i][2])','percent',0);
			// Fifth Graph, Hard Bounce Rate ---------------- hardbounces/(delivered+failures)
			newGraph('Hard Bounce Rate', 'hard-bounce-rate-graph', 'parseInt(emailData[department][i][4])/(parseInt(emailData[department][i][1])+ parseInt(emailData[department][i][5]))','percent',0, .25);
			// Sixth Graph, Complaint Rate ------------------ complaints/(delivered+failures)
			newGraph('Complaint Rate', 'complaint-rate-graph', 'parseInt(emailData[department][i][7])/(parseInt(emailData[department][i][1])+ parseInt(emailData[department][i][5]))','percent',0,.01,2);
		}		  	
      }  
  };
}
createGraph();

// Add tooltips to the graph 
jQuery(document).ready(function(){
	jQuery("#delivery-rate-graph").attr("title", "Higher is Better");
	jQuery("#delivery-rate-graph").attr("data-toggle", "tooltip");
	jQuery("#open-rate-graph").attr("title", "Higher is Better");
	jQuery("#open-rate-graph").attr("data-toggle", "tooltip");
	jQuery("#click-rate-graph").attr("title", "Higher is Better");
	jQuery("#click-rate-graph").attr("data-toggle", "tooltip");
	jQuery("#hard-bounce-rate-graph").attr("title", "Lower is Better");
	jQuery("#hard-bounce-rate-graph").attr("data-toggle", "tooltip");
	jQuery("#complaint-rate-graph").attr("title", "Lower is Better");
	jQuery("#complaint-rate-graph").attr("data-toggle", "tooltip");
	// if ISP box results are not good, give them a different color
	jQuery(".isp-box").each(function(index){
		if(jQuery(this).find("#percent").text() < 90 && jQuery(this).find("#percent").text() > 80){jQuery(this).addClass("isp-box-medium");}
		if(jQuery(this).find("#percent").text() < 80){jQuery(this).addClass("isp-box-low");}
		if(jQuery(this).find("#percent").text() == 0){jQuery(this).addClass("isp-box-error");}
	});
});