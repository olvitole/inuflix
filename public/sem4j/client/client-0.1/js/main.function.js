
// DB
var server_url = 'http://192.168.7.22:7474';

// SEARCH
function searchConcept(namespace){
	printLog('searchConcept');
	var vKeyword = $('#searchByConcept').val();
	// CYPHER QUERY
	v_data = {
		"query" : 
			"START x=node:`" + namespace + "`('name:" + vKeyword + "') " +
			"MATCH x-[?:`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`]-t " +
			"RETURN x.uri, t.name " +
			"LIMIT 100",
	    "params" : {}
	};
	printLog(v_data["query"]);
	// POST
	$.ajax({
		type: 'POST',
		url: server_url + '/db/data/cypher',
		data: v_data,
		dataType: 'json',
		success: function(result){
   			printLog('searchConcept AJAX succeeded');
   			
   			var pre_namespace = '', pre_type = '';
   			for(var i=0; i<result.data.length; i++) {
   				
   				var uri = result.data[i][0];
   				var type = result.data[i][1];
   				var name = getName(uri);
   				var namespace = getNamespace(uri);
   				// GROUPING REF AND TYPE
   				if (pre_namespace != namespace || pre_type != type) {
   					printRes('<B>[' + type + ']</B><br/>');
   				}
   				pre_namespace = namespace;
   				pre_type = type;
   				// NAME AND NAMESPACE
   				printRes('<a name="' + name + '" namespace="' + namespace + '">Add</a> ' + name + ' (' + namespace + ')<br/>');
   			}
   			// Add event for the results
   			$('div#result_c a').click(function(){
   				addConcept($(this).attr('name'), $(this).attr('namespace'));
   			});
   			printLog('searchConcept AJAX finished');
   		},
   		error: function(XMLHttpRequest, textStatus, errorThrown) {
   		  printLog(errorThrown + " : " + XMLHttpRequest.responseText);
   		}
	});
}
function addConcept(name, namespace){
	printLog('addConcept: ' + namespace + '/' + name);
	
	// CYPHER QUERY
	v_data = {
		"query" : 
			"START x=node:`" + namespace + "`(name='" + name + "') " +
			"MATCH x-[?:`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`]-t " +
			"RETURN x.uri, t.name? " +
			"LIMIT 100",
	    "params" : {}
	};
	// POST
	$.ajax({
		type: 'POST',
		url: server_url + '/db/data/cypher',
		data: v_data,
		dataType: 'json',
		success: function(result){
			printLog('addConcept AJAX succeeded');
			
			var uri = result.data[0][0];
			var type = result.data[0][1];
			
			var vnode = { "name" : getName(uri), "type" : type, "uri" : uri };
			nodes.push(vnode);
			start();
   			printLog('addConcept AJAX finished');
   		},
   		error: function(XMLHttpRequest, textStatus, errorThrown) {
   		  printLog(errorThrown + " : " + XMLHttpRequest.responseText);
   		}
	});
}
function getPropertyNei(target, target_type){
	printLog('getPropertyNei2');
	clearProNei();
	if (target_type == 'node') {
		var uri = target.uri;
		// CYPHER QUERY
		v_data = {
			"query" : 
				"START x=node:`" + getNamespace(uri) + "`(name='" + getName(uri) + "') " +
				"MATCH x-[r]-n, n-[?:`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`]->t " +
				"WHERE not(type(r) = \"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\") " +
				"RETURN t.name, count(*), type(r) " +
				"LIMIT 100",
		    "params" : {}
		};
		// POST
		$.ajax({
			type: 'POST',
			url: server_url + '/db/data/cypher',
			data: v_data,
			dataType: 'json',
			success: function(result){
				printLog('addConcept AJAX succeeded');
				
				printProNei('<H2>Neighbours</H2><BR>');
				for(var i=0; i<result.data.length; i++) {
					
					var type = result.data[i][0];
					var count = result.data[i][1];
					var rel_type = result.data[i][2];
					
					printProNei('<a uri="' + uri + '" type="' + rel_type + '">Add</a> ' + type + ' : ' + getName(rel_type) + ' (' + count + ')' );
				}
				// Add event for the results
	   			$('div#propertyNei a').click(function(){
	   				addNeighbours($(this).attr('uri'), $(this).attr('type'));
	   			});
				printLog('getPropertyNei AJAX finished');
				
	   		},
	   		error: function(XMLHttpRequest, textStatus, errorThrown) {
	   		  printLog(errorThrown + " : " + XMLHttpRequest.responseText);
	   		}
		});
	} else{
	}
}
function getProperty(target, target_type){
	printLog('getProperty');
	clearPro();
	if (target_type == 'node') {
		
		printPro('<H2>Node</H2><BR>');
		printPro('<B>ID:</B> ' + target.name);
		printPro('<B>Namespace:</B> ' + getNamespace(target.uri));
		printPro('<B>Type:</B> ' + target.type);
	
		var uri = target.uri;
		
		// CYPHER QUERY
		v_data = {
			"query" : 
				"START x=node:`" + getNamespace(uri) + "`(name='" + getName(uri) + "') " +
				"RETURN x",
		    "params" : {}
		};
		// POST
		$.ajax({
			type: 'POST',
			url: server_url + '/db/data/cypher',
			data: v_data,
			dataType: 'json',
			success: function(result){
				printLog('getProperty AJAX success');
				
				for(var i=0; i<result.data.length; i++) {
					var properties = result.data[0][0].data;
					printPro('<B>Properties:</B>');
					for (property in properties) {
						if (property != 'name' && property != 'uri') {
							printPro('- ' + getName(property) + ' : ' + properties[property]);
						}
					}
					printPro('<BR>');
				}
				printLog('getProperty AJAX finished');
			}
		});
	 } else if (event.group == 'edges') {
		 printPro('<H2>Edge (' + target.data['type'] + ')</H2><BR>');
		 printPro( '<B>Source:</B> ' + target.data['source'] );
		 printPro( '<B>Target:</B> ' + target.data['target'] );
		 printPro( '<B>Type:</B> ' + target.data['type'] );
		 printPro( '<B>Ref:</B> ' + target.data['ref'] );
	 } else {
		 //$('#floatWindow').fadeOut('fast');
		 printPro('<H2>Graph</H2><BR>');
		 printPro('<B>Node:</B> ' + network.data.nodes.length );
		 printPro('<B>Edge:</B> ' + network.data.edges.length );
		 addCommonNeighbours(vis.selected('nodes'));
	 }
}
function addNeighbours(uri, type){
	printLog('addNeighbours');
	
	// CYPHER QUERY
	v_data = {
		"query" : 
			"START x=node:`" + getNamespace(uri) + "`(name='" + getName(uri) + "') " +
			"MATCH x-[r:`" + type + "`]-n, " +
			"n-[?:`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`]-t " +
			"RETURN x.uri, n.uri, t.name, type(r) " +
			"LIMIT 100",
	    "params" : {}
	};
	
	printLog(v_data["query"]);
	
	// POST
	$.ajax({
		type: 'POST',
		url: server_url + '/db/data/cypher',
		data: v_data,
		dataType: 'json',
		success: function(result){
			printLog('addNeighbours AJAX succeeded');
			
			var new_nodes = result.data;
			//var graph1 = {nodes:[], relations:[]};
			
			var num_edge_added = 0;
			if(new_nodes.length > 600){
				alert('More than 600 neighbours found. The operation has been canceled.');
				return;
			}
			else {
				for(var i=0; i<new_nodes.length; i++){
					var x_uri = new_nodes[i][0];
					var n_uri = new_nodes[i][1];
					var n_name = getName(n_uri);
					var n_type = new_nodes[i][2];
					var rel_type = new_nodes[i][3];
					
					var x_index = getNodeIndex(x_uri);
					var n_index = getNodeIndex(n_uri);
					
					// WHEN NEW NODE DOES NOT EXIST
					if (n_index == 0) {
						var n_obj = { "uri":n_uri, "name":n_name, "type":n_type };
						var vrelation = { "source":nodes[x_index], "target":n_obj, "type":rel_type };
						nodes.push(n_obj);
						links.push(vrelation);
						//start();
					} else {
						//var n_obj = { "uri":n_uri, "name":n_name, "type":n_type };
						var vrelation = { "source":nodes[x_index], "target":nodes[n_index], "type":rel_type };
						//nodes.push(n_obj);
						links.push(vrelation);
					}
					num_edge_added = num_edge_added + 1;
				}
			}
			if(num_edge_added == 0){
				alert('No new neighbour is found.');
				return;
			}
			start();
			printLog('addNeighbours AJAX finished');
			
   		},
   		error: function(XMLHttpRequest, textStatus, errorThrown) {
   		  printLog(errorThrown + " : " + XMLHttpRequest.responseText);
   		}
	});
}

//TAB PANEL
function showPanel(selector){
	$('ul.tab li a').removeClass('selected');
	$(selector).addClass('selected');
	$('ul.panel li').slideUp('fast');
	$($(selector).attr('name')).slideDown('fast');
	return false;
}
function printLog(msg) {
	myDate = new Date();
	$('#log').prepend('<p>' 
			      + fixDigit(myDate.getHours(), 2) 
			+ ':' + fixDigit(myDate.getMinutes(), 2) 
			+ '.' + fixDigit(myDate.getSeconds(), 2) 
			+ '.' + fixDigit(myDate.getMilliseconds(), 3)
			+ ' ' + msg + '</p>');
}
function clearLog() {
	$('#log').html('');
}

//PRINT
function printRes(msg) {
	$('div#result_c').append(msg);
	return false;
}
function clearRes() {
	$('div#result_c').html('');
	return false;
}
function printPro(msg) {
	$('#property').append('<p>' + msg + '</p>');
	return false;
}
function clearPro() {
	$('#property').html('');
	return false;
}
function printProNei(msg) {
	$('#propertyNei').append('<p>' + msg + '</p>');
	return false;
}
function clearProNei() {
	$('#propertyNei').html('');
	return false;
}
function printLog(msg) {
	myDate = new Date();
	$('#log').prepend('<p>' 
			      + fixDigit(myDate.getHours(), 2) 
			+ ':' + fixDigit(myDate.getMinutes(), 2) 
			+ '.' + fixDigit(myDate.getSeconds(), 2) 
			+ '.' + fixDigit(myDate.getMilliseconds(), 3)
			+ ' ' + msg + '</p>');
}
function fixDigit(num, digit) {
	var str = String(num);
	while (str.length < digit) {
		str = '0'+str;
	}
	return str;
}
function clearLog() {
	$('#log').html('');
}


function getNodeIndex(uri) {
	var index = 0; // Dammy
	for (var i=0; i<nodes.length; i++) {
		if (nodes[i].uri == uri) {
			index = i;
		}
	}
	return index;
}
function getNamespace(uri) {
	return uri.match(/^(.*[\/|#])[^\/|#]+$/)[1];
}
function getName(uri) {
	return uri.match(/[\/|#]([^\/|#]+)$/)[1];
}