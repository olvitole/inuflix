
// DB
//var server_url = 'http://localhost:7474';
//var server_url = 'http://54.248.253.44/:7474';
var server_url = 'http://a70d19d29.hosted.neo4j.org:7573';

var allRef;
var allType;

// SEARCH
function searchConcept(namespace){
	printLog('searchConcept');
	var vKeyword = $('#searchByConcept').val();
	var vRef, vType;
	if ($('#selectRef').val() == 'All') {
		vRef = getRefList();
	} else {
		vRef = $('#selectRef').val();
	}
	if ($('#selectType').val() == 'All') {
		vType = getTypeList();
	} else {
		vType = $('#selectType').val();
	}
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
function searchCypher(){
	printLog('searchCypher');
	// CYPHER QUERY
	v_data = {
		"query" : 
			"START p=node:`http://tcng.hgc.jp/`(name='KRAS') " +
			"MATCH p<-[r:`http://tcng.hgc.jp/parent`]-s-[?:`http://tcng.hgc.jp/child`]->c " +
			"RETURN p, r, s",
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
   			printLog('searchCypher AJAX succeeded');
   			for(var i=0; i<result.data.length; i++) {
   				var path = result.data[i];
   				for(var j=0; j<path.length; j++) {
   					if (!path[j]["start"]) {
   						// NODE
   						var id = path[j]["self"];
   						var uri = path[j]["data"]["uri"];
   						var name = getName(uri);
   		   				var namespace = getNamespace(uri);
   		   				var type = "";
   		   				var vnode = { "uri":id, "name":name, "type":namespace }; // TYPE MUST BE DEFINED CORRECTLY
   		   				if (!getNodeIndex(vnode)) {
   		   					nodes.push(vnode);
   		   				}
   					}
   				}
   			}
   			for(var i=0; i<result.data.length; i++) {
   				var path = result.data[i];
   				for(var j=0; j<path.length; j++) {
   					if (path[j]["start"]) {
   						// RELATION
   						var type = path[j]["type"];
   						var source = path[j]["start"];
   						var target = path[j]["end"];
   						var source_index = getNodeIndex(source);
   						var target_index = getNodeIndex(target);
   						var vrelation = { "source":nodes[source_index], "target":nodes[target_index], "type":type };
   						links.push(vrelation);
   					}
   				}
   			}
   			start();
   			printLog('searchCypher AJAX finished');
   		},
   		error: function(XMLHttpRequest, textStatus, errorThrown) {
   		  printLog(errorThrown + " : " + XMLHttpRequest.responseText);
   		}
	});
}
function setSelectRef(){
	printLog('setSelectRef');
	var scopeRef = $('#scopeRef :checkbox');
	$('#selectRef').html('<option>All</option>');
	$('#filterRef').html('');
	scopeRef.each(function(){
		if($(this).attr('checked') == 'checked'){
			for (var j=0; j<allRef.length; j++) {
				if ($(this).val() == allRef[j].shortname) {
					$('#selectRef').append('<option value="' + allRef[j].shortname + '">' + allRef[j].fullname + '</option>');
					$('#filterRef').append('<div class="menu3_cb"><label><input type="checkbox" value="' + allRef[j].shortname + '" checked />' + allRef[j].fullname + '</label></input></div>');
				}
			}
		}
	});
}
function setSelectType(){
	printLog('getSelectType');
	var vRef;
	if ($('#selectRef').val() == 'All' || $('#selectRef').val() == '') {
		vRef = getRefList();
	} else {
		vRef = $('#selectRef').val();
	}
	$.ajax({
		url: 'GetScopeTypeConcept?ref=' + vRef,
		dataType: 'json',
		success: function(vData){
			printLog('getSelectType AJAX succeeded');
			$('#selectType').html('<option>All</option>');
			for(var i=0; i<vData.length; i++){
				$('#selectType').append('<option value="' + vData[i].shortname + '">' + vData[i].fullname + '</option>');
			}
			printLog('getSelectType AJAX finished');
		}
	});
}

// GET NETWORK
function addConcept(name, namespace){
	printLog('addConcept: ' + namespace + '/' + name);
	vRef = getRefList();
	vType = getTypeList();
	
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
function removeNodeData(nodeId){
	for(var i = 0; i < network.data.nodes.length; i++){
		if(network.data.nodes[i].id == nodeId){
			network.data.nodes.splice(i,1);
			i--;
		}
	}
};
function removeEdgeData(nodeId){
	for(var i = 0; i < network.data.edges.length; i++){
		if(network.data.edges[i].source == nodeId
				|| network.data.edges[i].target == nodeId){
			network.data.edges.splice(i,1);
			i--;
		}
	}
};

// SCOPE
// getAllRef: Get list of all reference database and show them in the View tab, then call setSelectRef and setScopeType.
// getAllType: unused # This function should be removed.
function getAllRef(callback){
	printLog('getAllRef');
	$.ajax({
		url: 'GetAllRef',
		dataType: 'json',
		success: function(vData){
			printLog('getAllRef AJAX succeeded');
			allRef = vData;
			$('#scopeRef').html('');
			for(var i=0; i<allRef.length; i++){
				if(allRef[i].fullname == "TCGA_MINI2" || allRef[i].fullname == "GeneOntology"){ // CCLE Only
					$('#scopeRef').append('<div class="menu3_cb"><label><input type="checkbox" value="' + allRef[i].shortname + '" />' + allRef[i].fullname + '</label></div>');
				} else {
					$('#scopeRef').append('<div class="menu3_cb"><label><input type="checkbox" value="' + allRef[i].shortname + '" checked />' + allRef[i].fullname + '</label></div>');
				}
			}
			callback();
			printLog('getAllRef AJAX finished');
		}
	});
}
function getAllType(){
	printLog('getAllType');
	$.ajax({
		url: 'GetAllType',
		dataType: 'json',
		success: function(vData){
			printLog('getAllType AJAX succeeded');
			allType = vData;
			$('#scopeTypeConcept').html('');
			for(var i=0; i<allType.length; i++){
				$('#scopeTypeConcept').append('<div class="menu3_cb"><input type="checkbox" value="' + allType[i].id + '" checked>' + allType[i].fullname + '</input></div>');
			}
			setSelectType();
			setFilterType();
			printLog('getAllType AJAX finished');
		}
	});
}
function getScopeTypeConcept(callback){
	printLog('getScopeTypeConcept');
	var vRef = getRefList();
	$.ajax({
		url: 'GetScopeTypeConcept?ref=' + vRef,
		dataType: 'json',
		success: function(vData){
			printLog('getScopeTypeConcept AJAX succeeded');
			allType = vData;
			$('#scopeTypeConcept').html('');
			for(var i=0; i<vData.length; i++){
				$('#scopeTypeConcept').append('<div class="menu3_cb"><label><input type="checkbox" value="' + vData[i].id + '" id="scopeTypeConcept_' + vData[i].id + '" checked>' + vData[i].fullname + '</label></div>');
			}
			callback();
			printLog('getScopeTypeConcept AJAX finished');
		}
	});
}
function getScopeTypeRelation(callback){
	printLog('getScopeTypeRelation');
	var vRef = getRefList();
	$.ajax({
		url: 'GetScopeTypeRelation?ref=' + vRef,
		dataType: 'json',
		success: function(vData){
			printLog('getScopeTypeRelation AJAX succeeded');
			allType = vData;
			$('#scopeTypeRelation').html('');
			for(var i=0; i<vData.length; i++){
				$('#scopeTypeRelation').append('<div class="menu3_cb"><label><input type="checkbox" value="' + vData[i].id + '" id="scopeTypeRelation_' + vData[i].id + '" checked>' + vData[i].fullname + '</label></div>');
			}
			callback();
			printLog('getScopeTypeRelation AJAX finished');
		}
	});
}
function getRefList(){
	var scopeRef = $('#scopeRef :checkbox');
	var refList = null;
	scopeRef.each(function(){
		if($(this).attr('checked') == 'checked'){
			if(refList == null){
				refList = '\'' + $(this).val() + '\'';
			}else{
				refList = refList + ',\'' + $(this).val() + '\'';
			}
		}
	});
	return refList;
}
function getTypeList(){
	var scopeTypeConcept = $('#scopeTypeConcept :checkbox');
	var typeList = null;
	scopeTypeConcept.each(function(){
		if($(this).attr('checked') == 'checked'){
			if(typeList == null){
				typeList = $(this).val();
			}else{
				typeList = typeList + ',' + $(this).val();
			}
		}
	});
	return typeList;
}

// FILTER
// getNodeTypeList: Get the list of node IDs existing on the canvas.
// getEdgeTypeList:
function setTypeConcept(){
	var typesConcept = getNodeTypeList();
	$('#filterTypeConcept').html('');
	$('#downloadTypeConcept').html('');
	// Concept types are already loaded in scopeType.
	var scopeTypeConcept = $('#scopeTypeConcept :checkbox');
	scopeTypeConcept.each(function(){
		if($(this).attr('checked') == 'checked'){
			// Check if concept with this type exists in the network.
			if($.inArray($(this).val(), typesConcept) >= 0){
				$('#filterTypeConcept').append('<div class="menu3_cb"><label><input type="checkbox" value="' + $(this).val() + '" checked />' + $(this).parent('label').text() + '</label></div>');
				$('#downloadTypeConcept').append('<div class="menu3_cb"><label><input type="checkbox" value="' + $(this).val() + '" />' + $(this).parent('label').text() + '</label></div>');
			}
		}
	});
}
function setTypeRelation(){
	var typesRelation = getEdgeTypeList();
	$('#filterTypeRelation').html('');
	$('#downloadTypeRelation').html('');
	var scopeTypeRelation = $('#scopeTypeRelation :checkbox');
	scopeTypeRelation.each(function(){
		if($(this).attr('checked') == 'checked'){
			// Check if concept with this type exists in the network.
			if($.inArray($(this).val(), typesRelation) >= 0){
				$('#filterTypeRelation').append('<div class="menu3_cb"><label><input type="checkbox" value="' + $(this).val() + '" checked />' + $(this).parent('label').text() + '</label></div>');
				$('#downloadTypeRelation').append('<div class="menu3_cb"><label><input type="checkbox" value="' + $(this).val() + '">' + $(this).parent('label').text() + '</label></div>');
			}
		}
	});
}
function filter(){
	var filterRef = $('#filterRef :checkbox');
	var visible;
	// Concept
	var filterTypeConcept = $('#filterTypeConcept :checkbox');
	vis.filter('nodes', function(node){
		visible = true;
		filterRef.each(function(){
			if($(this).attr('checked') != 'checked'){
				if(node.data.ref == $(this).val()){
					visible = false;
				}
			}
		});
		if (visible == true){
			filterTypeConcept.each(function(){
				if($(this).attr('checked') != 'checked'){
					if(node.data.type == $(this).val()){
						visible = false;
					}
				}
			});
		}
		return visible;
	});
	// Relation
	var filterTypeRelation = $('#filterTypeRelation :checkbox');
	vis.filter('edges', function(edge){
		visible = true;
		filterRef.each(function(){
			if($(this).attr('checked') != 'checked'){
				if(edge.data.ref == $(this).val()){
					visible = false;
				}
			}
		});
		if (visible == true){
			filterTypeRelation.each(function(){
				if($(this).attr('checked') != 'checked'){
					if(edge.data.type == $(this).val()){
						visible = false;
					}
				}
			});
		}
		return visible;
	});
}
/*
function setFilterType(){
	printLog('setFilterType');
	var scopeType = $('#scopeType :checkbox');
	$('#filterType').html('');
	scopeType.each(function(){
		if($(this).attr('checked') == 'checked'){
			for (var j=0; j<allType.length; j++) {
				if ($(this).val() == allType[j].id) {
					$('#filterType').append('<div class="menu3_cb"><input type="checkbox" value="' + allType[j].id + '" checked>' + allType[j].fullname + '</input></div>');
				}
			}
		}
	});
}
*/
function getNodeTypeList(){
	var types = [];
	for(var i=0; i<network.data.nodes.length; i++){
		types.push(network.data.nodes[i].type);
	}
	return $.unique(types);
}
function getEdgeTypeList(){
	var types = [];
	for(var i=0; i<network.data.edges.length; i++){
		types.push(network.data.edges[i].type);
	}
	return $.unique(types);
}

// SAVE
function saveNetwork(format, data){
	
	//Form
	var f = document.createElement('form');
	document.body.appendChild(f);
	f.action = 'Save';
	f.method = 'POST';
	f.target = '_blank';

	//Input
	var inp1 = document.createElement('input');
	f.appendChild(inp1);
	inp1.type = 'hidden';
	inp1.name = 'format';
	inp1.value = format;
	
	var inp2 = document.createElement('input');
	f.appendChild(inp2);
	inp2.type = 'hidden';
	inp2.name = 'data';
	inp2.value = data;

	//Submit
	f.submit();
}

function getPropertyNei(target, target_type){
	printLog('getPropertyNei2');
	clearProNei();
	vRef = getRefList();
	vType = getTypeList();
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
	   				addNeighbours($(this).attr('uri'), vRef, $(this).attr('type'));
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
function showProperty(event){
	printLog('showProperty');
	showPanel('ul.tab li a#a_tab3');
}

// UPLOAD
// getSourceNodeTypeList: Get the list of node IDs existing on the canvas.
function submitUpload(){
	printLog('submitUpload');
}

// DOWNLOAD
// setTypeConcept:
// setTypeRelation:
// submitDownload:
/*
function getSourceNodeTypeList(){
	var types = [];
	for(var i=0; i<network.data.edges.length; i++){
		types.push(vis.node(network.data.edges[i].source).data.type);
	}
	return $.unique(types);
}
function getTargetNodeTypeList(){
	var types = [];
	for(var i=0; i<network.data.edges.length; i++){
		types.push(vis.node(network.data.edges[i].target).data.type);
	}
	return $.unique(types);
}
*/
/*
function setTypeConcept(){
	var typeConcept = getNodeTypeList();
	$('#typeConcept').html('');
	var scopeType = $('#scopeType :checkbox');
	scopeType.each(function(){
		if($(this).attr('checked') == 'checked'){
			if($.inArray($(this).val(), typeConcept) >= 0){
				$('#typeConcept').append('<div class="menu3_cb"><label><input type="radio" name="typeSource" value="' + $(this).val() + '">' + $(this).parent('label').text() + '</label></div>');
			}
		}
	});
}
function setTypeRelation(){
	var typesSource = getSourceNodeTypeList();
	var typesTarget = getTargetNodeTypeList();
	$('#typeSource').html('');
	$('#typeTarget').html('');
	var scopeType = $('#scopeType :checkbox');
	scopeType.each(function(){
		if($(this).attr('checked') == 'checked'){
			if($.inArray($(this).val(), typesSource) >= 0){
				$('#typeSource').append('<div class="menu3_cb"><label><input type="radio" name="typeSource" value="' + $(this).val() + '">' + $(this).parent('label').text() + '</label></div>');
			}
			if($.inArray($(this).val(), typesTarget) >= 0){
				$('#typeTarget').append('<div class="menu3_cb"><label><input type="radio" name="typeTarget" value="' + $(this).val() + '">' + $(this).parent('label').text() + '</label></div>');
			}
		}
	});
}
*/
function submitDownload(){
	printLog('submitDownload');
	var text = '';
	var typeSource = '16';
	var typeTarget = '6';
	//var typeSource = $('input[name="typeSource"]:checked').val();
	//var typeTarget = $('input[name="typeTarget"]:checked').val();
	// Title
	text = 'Cell Line' + ',' + 'Compound' + ',' + 'Ref' + ',Value\n';
	//text = $('input[name="typeSource"]:checked').parent('label').text() + ',' + $('input[name="typeTarget"]:checked').parent('label').text() + ',Value\n';
	for(var i=0; i<network.data.edges.length; i++){
		printLog('edge id: ' + network.data.edges[i].id);
		var edge_i = network.data.edges[i];
		printLog('edge type: ' + edge_i.type);
		if(edge_i.type){ // Will be modifyied as "edge_i.type == ??"
			if(vis.node(edge_i.source).data.type == typeSource && vis.node(edge_i.target).data.type == typeTarget){ 
				text = text + vis.node(edge_i.source).data.label + ',' + vis.node(edge_i.target).data.label + ',' + vis.node(edge_i.target).data.ref + ',' + vis.edge(edge_i.id).data.weight + '\n';
			}
		}
	}
	saveNetwork('csv', text);
}

function addNeighbours(uri, ref, type){
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

function addCommonNeighbours(selectedNodes){
	var nodeA = selectedNodes[0];
	var nodeB = selectedNodes[1];
	var vRef = getRefList();
	var vType = getTypeList();
	printLog('addCommonNeighbours');
	$.ajax({
		url: 'GetCommonNeighbours?conceptA_id=' + nodeA.data.id + '&conceptB_id=' + nodeB.data.id + '&ref=' + vRef + '&type=' + vType,
		dataType: 'json',
		success: function(vdata){
			printLog('addCommonNeighbours AJAX succeeded');
			var num_edge_added = 0;
			var angle = 360 / vdata.nodes.length;
			var mid_x = (nodeA.x + nodeB.x) / 2;
			var mid_y = (nodeA.y + nodeB.y) / 2;
			for(var i=0; i<vdata.nodes.length; i++){
				if(vis.node(vdata.nodes[i].id)==null){
					network.data.nodes.push(vdata.nodes[i]);
					vis.addNode(mid_x + Math.sin(angle * i) * 100, mid_y + Math.cos(angle * i) * 100, vdata.nodes[i]);
				}
			}
			for(var i=0; i<vdata.edges.length; i++){
				if(vis.edge(vdata.edges[i].id)==null){
					network.data.edges.push(vdata.edges[i]);
					vis.addEdge(vdata.edges[i]);
					num_edge_added = num_edge_added + 1;
				}
				// Remove unnecessary labels generated prob by a bug of Cytoscape Web
				filter();
			}
			if(num_edge_added == 0){
				alert('No new neighbour is found.');
				return;
			}
			printLog('addCommonNeighbours AJAX finished');
		}
	});
}
function addCommonNeighboursMulti(selectedNodes){
	var vRef = getRefList();
	var vType = getTypeList();
	printLog('addCommonNeighboursMulti');
	
	var nodesA = '0';
	var nodeB = '';
	for(var i = 0; i < selectedNodes.length; i++){
		if(selectedNodes[i].data.type == '17'){
			nodesA = nodesA + ',' + selectedNodes[i].data.id;
		}
		if(selectedNodes[i].data.type == '6'){
			nodeB = selectedNodes[i].data.id;
		}
	}
	
	$.ajax({
		url: 'GetCommonNeighboursMulti?conceptA_id=' + nodesA + '&conceptB_id=' + nodeB + '&ref=' + vRef + '&type=' + vType,
		dataType: 'json',
		success: function(vdata){
			printLog('addCommonNeighboursMulti AJAX succeeded');
			var num_edge_added = 0;
			var angle = 360 / vdata.nodes.length;
			for(var i=0; i<vdata.nodes.length; i++){
				if(vis.node(vdata.nodes[i].id)==null){
					network.data.nodes.push(vdata.nodes[i]);
					vis.addNode(vis.node(nodeB).x + Math.sin(angle * i) * 100, vis.node(nodeB).y + Math.cos(angle * i) * 100, vdata.nodes[i]);
				}
			}
			for(var i=0; i<vdata.edges.length; i++){
				if(vis.edge(vdata.edges[i].id)==null){
					network.data.edges.push(vdata.edges[i]);
					vis.addEdge(vdata.edges[i]);
					num_edge_added = num_edge_added + 1;
				}
				// Remove unnecessary labels generated prob by a bug of Cytoscape Web
				filter();
			}
			if(num_edge_added == 0){
				alert('No new neighbour is found.');
				return;
			}
			printLog('addCommonNeighboursMulti AJAX finished');
		}
	});
}
function addShortestPaths(selectedNodes){
	var nodeA = selectedNodes[0];
	var nodeB = selectedNodes[1];
	var vRef = getRefList();
	var vType = getTypeList();
	printLog('addShortestPaths');
	$.ajax({
		url: 'GetPath?conceptA_id=' + nodeA.data.id + '&conceptB_id=' + nodeB.data.id + '&ref=' + vRef + '&type=' + vType,
		dataType: 'json',
		success: function(vdata){
			printLog('addShortestPaths AJAX succeeded');
			var num_edge_added = 0;
			var angle = 360 / vdata.nodes.length;
			var mid_x = (nodeA.x + nodeB.x) / 2;
			var mid_y = (nodeA.y + nodeB.y) / 2;
			for(var i=0; i<vdata.nodes.length; i++){
				if(vis.node(vdata.nodes[i].id)==null){
					network.data.nodes.push(vdata.nodes[i]);
					vis.addNode(mid_x + Math.sin(angle * i) * 100, mid_y + Math.cos(angle * i) * 100, vdata.nodes[i]);
				}
			}
			for(var i=0; i<vdata.edges.length; i++){
				if(vis.edge(vdata.edges[i].id)==null){
					network.data.edges.push(vdata.edges[i]);
					vis.addEdge(vdata.edges[i]);
					num_edge_added = num_edge_added + 1;
				}
				// Remove unnecessary labels generated prob by a bug of Cytoscape Web
				filter();
			}
			if(num_edge_added == 0){
				alert('No new neighbour is found.');
				return;
			}
			printLog('addImmediateNeighbours AJAX finished');
		}
	});
}
function removeThisNode(selectedNode){
	// Remove node from vis
	vis.removeNode(selectedNode);
	// Remove node and edge from network.data
	removeNodeData(selectedNode.data.id);
	removeEdgeData(selectedNode.data.id);
}
function removeImmediateNeighbours(selectedNode){
	
}
function removeSelectedNodes(selectedNodes){
	var nodeIdList = new Array();
	for(var i = 0; i < selectedNodes.length; i++){
		nodeIdList.push(selectedNodes[i].data.id);
	}
	for(var j = 0; j < nodeIdList.length; j++){
		vis.removeNode(nodeIdList[j]);
		removeNodeData(nodeIdList[j]);
		removeEdgeData(nodeIdList[j]);
	}
}
function removeUnselectedNodes(selectedNodes){
	var nodeIdList = new Array();
	// Create Node ID List
	for(var i = 0; i < network.data.nodes.length; i++){
		var selected = false;
		for(var j = 0; j < selectedNodes.length; j++){
			if(network.data.nodes[i].id == selectedNodes[j].data.id){
				selected = true;
			}
		}
		if(selected == false){
			nodeIdList.push(network.data.nodes[i].id);
		}
		}
	// Remove
	for(var j = 0; j < nodeIdList.length; j++){
		vis.removeNode(nodeIdList[j]);
		removeNodeData(nodeIdList[j]);
		removeEdgeData(nodeIdList[j]);
	}
}
function removeSameTypeNodes(selectedNode){
	var nodeIdList = new Array();
	// create list of nodes to be deleted
	for(var i = 0; i < network.data.nodes.length; i++){
		if(network.data.nodes[i].type == selectedNode.data.type){
			nodeIdList.push(network.data.nodes[i].id);
	 	}
		}
	// remove nodes and edges
	for(var j = 0; j < nodeIdList.length; j++){
		vis.removeNode(nodeIdList[j]);
		removeNodeData(nodeIdList[j]);
		removeEdgeData(nodeIdList[j]);
	}
}
function removeThisEdge(selectedEdge){
	// remove edge from vis
	vis.removeEdge(selectedEdge);
	// remove edge from network.data (Different from removeEdgeData)
	for(var i = 0; i < network.data.edges.length; i++){
		if(network.data.edges[i].source == selectedEdge.data.source
				&& network.data.edges[i].target == selectedEdge.data.target){
			network.data.edges.splice(i,1);
			i--;
		}
	}
}
function removeAll(){
	vis.removeElements();
	network.data = {nodes: [ ], edges: [ ]};
}

// PRINT
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

// TAB PANEL
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

// TAB PANEL
function showPanel(selector){
	$('ul.tab li a').removeClass('selected');
	$(selector).addClass('selected');
	$('ul.panel li').slideUp('fast');
	$($(selector).attr('name')).slideDown('fast');
	return false;
}

//
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

