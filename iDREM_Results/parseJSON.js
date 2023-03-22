//google.charts.load('current', {packages: ['corechart']});
//google.charts.setOnLoadCallback(onload);
// CREDIT fully to the original iDREM Creator!
// https://github.com/phoenixding/idrem

// I just made simple edits to focus on what we presented in the manuscript
// wait for page to load
window.addEventListener('load', loadGoogle, false);

function loadGoogle() {
  // define callback in load statement
  google.charts.load('current', {packages: ['corechart']});
  google.charts.setOnLoadCallback(onload);
}

function onload(){
	
	  // load google visualization APIs-->
	for (var i in data){
		if (data[i]==null){
			data[i]=[];
		}
	}
	[nodes,methyscore,geneRegMap,exgene,reg,genex,mirex,mirID,geneabex,mirabex,protex]=data;	
	nodes=getNodeGenes(nodes);
	nodes=buildTree(nodes);
	nodes=sortNodeChildren(nodes);
	timePoints=getAllTime(nodes);
	regTargetMap=buildTargetMap(geneRegMap); //reg-> gene targets
	root=nodes[0];
	drawTree(root);
	createDropDown("Genes","#clickdropdowndiv", "clickdropdown",
					["Regulator",
					"KEGG (28 Days only)",
					"Subnetworks (28 Days only)",
					]);
	createDropDown("Choose TF","#tfdropdown","tfdropdown",reg,tfdropdownonchange);

	//show page after loading
	showPage();


	
	// cell types dropdown
	[singleCells,sortedCells]=data_cells;
	[KEGG]=data_kegg;
	
	var singlecelltypes=[];
	for (var row of singleCells){
		var ctype=row[1];
		if (singlecelltypes.indexOf(ctype)==-1){
			singlecelltypes.push(ctype);
		}
	}
	createDropDown("Choose Subnetwork","#singlecelldropdowndiv","singlecelldropdown",singlecelltypes,singlecelldropdownonchange)
	
	var sortedcelltypes=[];
	for (var row of sortedCells){
		var ctype=row[1];
		if (sortedcelltypes.indexOf(ctype)==-1){
			sortedcelltypes.push(ctype);
		}
	}
	
	createDropDown("Choose Sorted Cell Types","#sortedcelldropdowndiv","sortedcelldropdown",sortedcelltypes,sortedcelldropdownonchange)
		
	//compare 
	compareNodes=cdata;
	

};

//showpage after loading
var showPage=function(){
	document.getElementById("loadercontainer").style.display="none";
	document.getElementById("myviz").style.display="block";
}

/* pre-process the data*/

//get all time points
var getAllTime=function(nodes){
	var timeList=[];
	for (var node of nodes){
		if (timeList.indexOf(node.nodetime)==-1){
			timeList.push(node.nodetime);
		}
	}
	return timeList;
}

// get genes for each node
var getNodeGenes=function(nodes){
	
	for (var node of nodes){
		var gList=[];
		var bin=node.genesInNode;
		for (var i in bin){
			if (bin[i]){
				gList.push(exgene[i]);
			}
		}
		node["genes"]=gList;	
	}
	return nodes;
};

// build target map 
var buildTargetMap=function(geneRegMap){
	var regTargetMap={};
	for (var i in geneRegMap){
		var gene=exgene[i];
		for (var gt of geneRegMap[i]){
			var gtname=reg[gt].toUpperCase();
			if (!(gtname in regTargetMap)){
				regTargetMap[gtname]=[gene];
			}else{
				regTargetMap[gtname].push(gene);
			}
		}
	}
	return regTargetMap;
}

//sort children nodes based on mean expression value
var sortNodeChildren=function(nodes){
	for (var node of nodes){
		node.children.sort(nodeCompare);
	}
	return nodes;
};


//create tree structure
var buildTree=function(nodes){
	var xc;
	for (var x of nodes){
		if(x.parent!="-1"){
			x.parent=nodes[x.parent];
		}else{
			x.parent=null;
		}
		
		xc=[];
		for (var y of x.children){
			if (y!=-1){
				xc.push(nodes[y]);
			}
		}
		if(xc==[]){
			xc=null;
		}
		
		x.children=xc;
	}
	
	return nodes;	
};


//drawTree
var drawTree=function(root){
		var margin = {top: 20, right: -20, bottom: 20, left: 40},
		width = 550 - margin.right - margin.left,
		height =550 - margin.top - margin.bottom;
		var i = 0;
		var tree = d3.layout.tree();
		tree.size([750,650]);
		
		var diagonal = d3.svg.diagonal()
			.projection(function(d) { return [d.y, d.x]; });
		
		//default bgcolor
		var default_bgcolor="#fff";
		var bgcolor;
		var input_bgcolor=d3.select("#bgcolor").value;
		colorisOK  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(input_bgcolor)
		if (colorisOK){
			bgcolor=input_bgcolor;
		}else{
			bgcolor=default_bgcolor;
		}
		svg = d3.select("#div_svg").append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("id","svg")
			.style("background",bgcolor)
			.attr("viewBox","0 0 800 800")
			.attr("preserveAspectRatio", "none")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
		var allnodes=tree.nodes(root);
		var links=tree.links(allnodes);
		 
		// Declare the nodes
		var node = svg.selectAll("g.node")
		  .data(nodes)
		  .data(nodes, function(d) { return d.id = ++i; });

		// Enter the nodes.
		var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .style("font","8px Arial")
		  .attr("transform", function(d) { 	 
			  return "translate(" + d.y + "," + d.x + ")"; });
		
		//TODO: Handle click events
		nodeEnter.append("circle")
		  .attr("r", 16)
		  .attr("fill","#fff")
		  .attr("fill","#fff")
		  .attr("stroke","steelblue")
		  .attr("stroke-width","3px")
		  .on("mouseover",inNode)
		  .on("mouseout",outNode)
		  .on("click",function(){
					var clickdropdownValue=document.getElementById("clickdropdown").value;
					switch(clickdropdownValue){
						case "Genes":
							showGenesNode(this.__data__);
							break;
						case "Subnetworks (28 Days only)":
							showSingleCell(this.__data__);
							break;
						case "KEGG (28 Days only)":
							showKEGG(this.__data__);
							break;
						default:
							showmouseover(this.__data__);
				}
			  });
			  
		var textEnter=nodeEnter.append("text")
		  .text(function(d){

				if([0, 1, 5, 15, 28].includes(d.nodeID)){
					return d.nodetime+' Days';
				}else{
					return '';
				}

			})
		  .attr("x",-30)
		  .attr("dy", "2em")
		  .attr("class","nodetext")
		  .attr("fill","#000")
		  .attr("text-anchor", function(d) { 
			  return  "start"; })
		  .style("fill-opacity", 1)
		  .style("font","20px Arial");

		
		
		// Declare the links
		var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; })
		  .enter();

		// Enter the links.
		link.insert("path", "g")
		  .attr("class", "link")
		  //.attr("stroke","#aaa")
		  .attr("stroke",function(d,i){
				switch(i){
						case 0:
							return "#cd3533";
							break;
						case 1:
							return "#f58020";
							break;
						case 2:
							return "#818181";
							break;
						case 3:
							return "#9696ca";
							break;
						case 4:
							return "#996828";
							break;
						case 5:
							return "#333333";
							break;
						case 6:
							return "#ed1b68";
							break;
						case 7:
							return "#333333";
							break;
						case 8:
							return "#ed1b68";
							break;
						case 9:
							return "#02679a";
							break;
						case 10:
							return "#9b1b1f";
							break;
						case 11:
							return "#02679a";
							break;
						case 12:
							return "#9b1b1f";
							break;
						case 13:
							return "#01999a";
							break;
						case 14:
							return "#8b7456";
							break;
						case 15:
							return "#a94499";
							break;
						case 16:
							return "#2e8b58";
							break;
						case 17:
							return "#6b52a2";
							break;
						case 18:
							return "#2e8b58";
							break;
						case 19:
							return "#6b52a2";
							break;
						case 20:
							return "#8b7456";

						case 21:
							return "#8b7456";
							break;
						case 22:
							return "#a94499";
							break;
						case 23:
							return "#a94499";
							break;
						case 24:
							return "#ce5c46";
							break;
						case 25:
							return "#0f3c3c";
							break;
						case 26:
							return "#566b30";
							break;
						case 27:
							return "#797cbb";
							break;
						case 28:
							return "#ed1b68";
							break;
						case 29:
							return "#ed1f80";
							break;
						case 30:
							return "#797cbb";
							break;
						case 31:
							return "#ed1f80";
							break;
						case 32:
							return "#a2a269";
							break;
						case 33:
							return "#036667";
							break;
						case 34:
							return "#a2a269";
							break;
						case 35:
							return "#036667";
							break;

						default:
							return '#fff';
					}

			})
		  .attr("stroke-width","5px")
		  .attr("fill","none")
		  .attr("d", diagonal)
		  .attr("id",function(d,i){return "s"+i;})
		  .attr("color","black");
		 
		 
		 //link text
		link.append("text")
		.append("textPath")
		.attr("class","linktext")
		.attr("xlink:href",function(d,i){return "#s"+i;})
		.attr("startOffset","20%")
		.attr("dy","-1em");
		 
		 // Define the div for the tooltip (Enable mouse over popup)
		tooltipdiv = d3.select("body").append("div")	
			.attr("class", "tooltip");
			
		//label path
		labelPath();
};

//label path
var labelPath=function(){
	var nodes=d3.selectAll("g.node")[0];
	var leafnodes=[];
	for (var node of nodes){
		if (node.__data__.children==undefined ||node.__data__.children.length==0){
			leafnodes.push(node);
		}
	}
	var leafMU=[];
	for (var node of leafnodes){
		leafMU.push(node.__data__.nodeMean);
	}
	
	leafMU.sort(function(a,b){return b-a});

	d3.selectAll(leafnodes)
	.append('text')
	.attr("x",30)
	.text(function(d,i){
		    var di=d.nodeMean;
		    var di=leafMU.indexOf(di);
			var chr=1+di;
			d["path"]=chr;
			return 'T-'+chr;
		})
	.style("font-size","30px")
	.attr("font-family", "Arial")
	.attr("font-weight", "Bold")
	.attr("fill", function(d,i){
				var di=d.nodeMean;
				var di=leafMU.indexOf(di);
				var chr=1+di;
				switch(chr){
						case 1:
							return "#333333";
							break;
						case 2:
							return "#ed1b68";
							break;
						case 3:
							return "#02679a";
							break;
						case 4:
							return "#2e8b58";
							break;
						case 5:
							return "#a94499";
							break;
						case 6:
							return "#8b7456";
							break;
						case 7:
							return "#6b52a2";
							break;
						case 8:
							return "#9b1b1f";
							break;
						case 9:
							return "#566b30";
							break;
						case 10:
							return "#797cbb";
							break;
						case 11:
							return "#ed1f80";
							break;
						case 12:
							return "#a2a269";
							break;
						case 13:
							return "#036667";
							break;
						default:
							return '#000';
					}
	}

	)
	
	leafnodesData=leafnodes.map(function(d){return d.__data__});
	
	for (var node of leafnodesData){
		var path=[];
		while(node!=undefined){
			path.push(node);
			node=node.parent;
		}
		
		for (var i=1;i<path.length;i++){
			var node=path[i];
			if ("path" in node){
				node["path"]+=","+path[0].path;;
			}else{
				node["path"]=path[0].path;;
			}
		}
	}
}


/* config set section*/

//popup change
var popupchange=function(newValue){
	document.getElementById("popupcut").innerHTML=newValue;
}

//tfCutoff selector action
var tfcutChange=function(newValue){
	document.getElementById("tfcutSelector").innerHTML=50;
	exploretf();
}

//zoom slider bar action
var zoom=function(newValue){
		document.getElementById("zoomslider").innerHTML=newValue;
		var wd=800;
		var ht=800;
		var sv=50;

		var zx=newValue/sv;
		var newwd=wd*zx;
		var newht=ht*zx;
		
		d3.select("#div_svg").select("svg")
		.attr("width",newwd)
		.attr("height",newht)
		.attr("preserveAspectRatio", "none");
};

//set go sliders
var setgoslider=function(newValue){
	document.getElementById("goslider").innerHTML=newValue;
}

var setsankeytfslider=function(newValue){
	document.getElementById("sankeytfslider").innerHTML=newValue;
}

var setsankeymirslider=function(newValue){
	document.getElementById("sankeymirslider").innerHTML=newValue;
}

////////////////////////
//set bgcolor
var setbgcolor=function(){
		var color=document.getElementById("bgcolor").value;
		d3.select("svg").style("background", color);
};

//set nodecolor
var setnodecolor=function(){
	var color=document.getElementById("nodecolor").value;
	d3.selectAll("g.node")
	.selectAll("circle")
	.attr("fill",color);
}

//set path color
var setpathcolor=function(){
	var color=document.getElementById("pathcolor").value;
	d3.select("svg")
	.selectAll("path")
	.attr("stroke",color);
}

var settextcolor=function(){
	var color=document.getElementById("textcolor").value;
	d3.selectAll("g.node")
	.selectAll("text")
	.attr("fill",color);
}

var resetnodesize=function(){
	var nodesize=document.getElementById("nodesizetext").value;
	d3.selectAll("circle")
	.attr("r",nodesize);
}

var resettextsize=function(){
	var textsize=document.getElementById("textsize").value;
	d3.selectAll("g.node")
	.selectAll("text")
	.style("font-size",textsize);
}

var resetconfig2=function(){
		resetPath2();
		resetNode2();
};

//reset path
var resetPath2=function(){
	d3.select("svg").selectAll("path")
		.attr("stroke-width","5px");
		
	d3.selectAll(".linktext")
		.text("");
};

//reset node

var resetNode2=function(){
	d3.selectAll(".nodeExText")
		.text("");
	d3.selectAll("g.node")
	.selectAll("circle")
	.attr("fill","#fff");
};


/*node action section */

// in node function	
var inNode=function(){
	if (d3.select("#tooltipcheck").property("checked")==false){
			return false;
	}
	var showcut=20;
	var etf=JSON.parse(JSON.stringify(this.__data__.ETF));
	var row=etf[0];
	var rowT1="TF	Num Total	Num Parent	Num Path	Expect Overall	Diff. Overall	Score Overall	Expect Split	Diff. Split	Score Split	% Split";
	var rowT2="TF	Num Total	Num Path	Expect Overall	Diff. Overall	Score Overall";
	var cetf=[];
	if (row.length==rowT1.split("\t").length){
		cetf.push(rowT1.split("\t"));
	}
	
	if (row.length==rowT2.split("\t").length){
		cetf.push(rowT2.split("\t"));
	}
	
	for (var i=0;i<showcut;i++){
		cetf[i][0]=cetf[i][0].split(" ")[0];
		cetf.push(etf[i]);
	}
	
	tooltipdiv
			//.style("left",(d3.event.pageX+30)+"px")
			//.style("top",(d3.event.pageY-28)+"px")
			.style("left",1200+"px")
			.style("top", 10+"px")
			.style("position","absolute")
			.style("opacity",1)
			.style("background","silver")
			.style("border","1px solid")
			.attr("class","tooltipsvg")
			.attr("width",300)
			.attr("height",300);
			
	createTFTable(tooltipdiv,"tftable",cetf,exploregene,this.__data__.depth);
};

//mouse out node function
var outNode=function(){
	
		tooltipdiv
		//.style("opacity", 0)
		.attr("width",0)
		.attr("height",0)
		.selectAll("*").remove();;
};


//show genes assigned to the node
var showGenesNode=function(node){
	d3.event.preventDefault();
	var geneList=[];
	var geneIndex=node.genesInNode;
	for (var i in geneIndex){
		var iList=[];
		if (geneIndex[i]){
			var iex=genex[i][node.depth];
			var nodeProb=NormProb(iex,node.nodeMean,node.nodeSigma);
			var pathProb=0;
			var iNodes=getNodeList(exgene[i]);
			for (var iNode of iNodes){
				var iNodeEx=genex[i][iNode.__data__.depth];
				var iprob=NormProb(iNodeEx,iNode.__data__.nodeMean,iNode.__data__.nodeSigma)
				pathProb=pathProb+iprob;
			} 
			iList.push(exgene[i]);
			iList.push(nodeProb);
			iList.push(pathProb);
			geneList.push(iList);
		}
	}
	geneList.sort(function(a,b){
			if (a[2]<b[2]){
				return -1;
			}else if (a[2]>b[2]){
				return 1;
			}else{
				return 0;
			}
		});
	
	var geneListWithID=[['Gene','Node Score (small = good)','Path Score (small = good)']];
	for (var row of geneList){
		geneListWithID.push(row);
	}
	
	
	var newW = open('','_blank','height=600,width=600,left=1400,top=200,scrollbars=yes');
	newW.document.write("<body></body>");
	var genediv=d3.select(newW.document.body)
		.style("background","white")
		.append("div")
		.style("padding-left","50px")
		.style("padding-top","50px")
		.attr("width",400)
		.attr("height",600)
		.attr("class","div_table_edge");
	createTable(genediv,"genetable",geneListWithID,exploregene);
};

//show sorted cells
var showSortedCell=function(node){
	var N=exgene.length;
	var scResultList=[]
	var firstRow=['nodeID','cell_type','#_of_overlapping_genes','overlapping_pvalue','overlapping_genes'];
	for (var cell of sortedCells){
		var cell_time=cell[0];
		var cell_type=cell[1].toUpperCase();
		var cell_target=cell[2].split(",").map(function(d){return d.toUpperCase();});
		cell_target=cell_target.filter(function(d){
				if (exgene.indexOf(d)!=-1){
					return true;
				}else{
					return false;
				}
			});
		
		if (node.nodetime==cell_time){
			var p=cell_target.length*1.0/N;
			var pv_cut=0.05;
			var timeNodes=[];
			var ov_tar=cell_target.filter(function(d){
				if (node.genes.indexOf(d)!=-1){
					return true;
				}else{
					return false;
				}
			});	
			var pv=1-pbinom(ov_tar.length-1,node.genes.length,p);
			if (pv<pv_cut){
				scResultList.push([node.nodeID,cell_type,ov_tar.length,pv,ov_tar]);
			}
		}
	}
	scResultList.sort(function(a,b){
			if (a[3]<b[3]){
				return -1;
			}else if (a[3]>b[3]){
				return 1;
			}else{
				return 0;
			}
		});
	
	//
	scResultListFR=[firstRow];
	for (var row of scResultList){
		scResultListFR.push(row);
	}
	
	var newW = open('','_blank','height=600,width=600,left=1400,top=200,scrollbars=yes');
	newW.document.write("<body></body>");
	var genediv=d3.select(newW.document.body)
		.style("background","white")
		.append("div")
		.style("padding-left","50px")
		.style("padding-top","50px")
		.style("margin-right","100px")
		.attr("width",400)
		.attr("height",600)
		.attr("class","div_table_sorted");
	createTable(genediv,"sorted_table",scResultListFR);
}

var showKEGG=function(node){
	var N=exgene.length;
	var keggResultList=[];
	var firstRow=['KEGG Pathway','P-Value','Adjusted P-Value', '# of Overlapping Genes','Overlapping Genes'];
	var trackid;
				switch(node.nodeID){
						case 29:
							trackid="T-1";
							break;
						case 30:
							trackid="T-2";
							break;
						case 31:
							trackid="T-3";
							break;
						case 33:
							trackid="T-4";
							break;
						case 36:
							trackid="T-5";
							break;
						case 35:
							trackid="T-6";
							break;
						case 34:
							trackid="T-7";
							break;
						case 32:
							trackid="T-8";
							break;
						case 24:
							trackid="T-9";
							break;
						case 25:
							trackid="T-10";
							break;
						case 26:
							trackid="T-11";
							break;
						case 27:
							trackid="T-12";
							break;
						case 28:
							trackid="T-13";
							break;
					}
	for (var terms of KEGG){
		var track=terms[0];
		if (trackid==track){
			var pwname=terms[1];
			var pval=terms[2];
			var padj=terms[3];
			var target=terms[4].split(",").map(function(d){return d.toUpperCase();});
			target=target.filter(function(d){
					if (exgene.indexOf(d)!=-1){
						return true;
					}else{
						return false;
					}
				});
				var ov_tar=target.filter(function(d){
					if (node.genes.indexOf(d)!=-1){
						return true;
					}else{
						return false;
					}
				});	
			
			keggResultList.push([pwname,pval,padj,ov_tar.length,ov_tar]);
		}
	}
	//
	keggResultList.sort(function(a,b){
			if (a[2]<b[2]){
				return -1;
			}else if (a[2]>b[2]){
				return 1;
			}else{
				return 0;
			}
		});
	
	keggResultListFR=[firstRow];
	for (var row of keggResultList){
		keggResultListFR.push(row);
	}
	
	if(node.nodetime==28){
		var newW = open('','_blank','height=600,width=600,left=1400,top=200,scrollbars=yes');
		newW.document.write("<body></body>");
		var genediv=d3.select(newW.document.body)
			.style("background","white")
			.append("div")
			.style("padding-left","50px")
			.style("padding-top","50px")
			.style("margin-right","100px")
			.attr("width",400)
			.attr("height",600)
			.attr("class","div_table_kegg");
		createTable(genediv,"kegg_table",keggResultListFR);
	}
}


// show single cells
var showSingleCell=function(node){

	var N=exgene.length;
	var scResultList=[];
	var firstRow=['GCN Subnetwork','P-Value','# of Overlapping Genes','Overlapping Genes'];
	for (var cell of singleCells){
		var cell_time=cell[0];
		var cell_type=cell[1].toUpperCase();
		var cell_target=cell[2].split(",").map(function(d){return d.toUpperCase();});
		cell_target=cell_target.filter(function(d){
				if (exgene.indexOf(d)!=-1){
					return true;
				}else{
					return false;
				}
			});
		if (node.nodetime==cell_time){
			var p=cell_target.length*1.0/N;
			var pv_cut=0.05;
			var timeNodes=[];
			var ov_tar=cell_target.filter(function(d){
				if (node.genes.indexOf(d)!=-1){
					return true;
				}else{
					return false;
				}
			});	
			var pv=1-pbinom(ov_tar.length-1,node.genes.length,p);

			if (pv<pv_cut){
				scResultList.push([cell_type,pv,ov_tar.length,ov_tar]);
			}
		}
	}
	//
	scResultList.sort(function(a,b){
			if (a[3]<b[3]){
				return -1;
			}else if (a[3]>b[3]){
				return 1;
			}else{
				return 0;
			}
		});
	
	scResultListFR=[firstRow];
	for (var row of scResultList){
		scResultListFR.push(row);
	}
	
	if(node.nodetime==28){
		var newW = open('','_blank','height=600,width=600,left=1400,top=200,scrollbars=yes');
		newW.document.write("<body></body>");
		var genediv=d3.select(newW.document.body)
			.style("background","white")
			.append("div")
			.style("padding-left","50px")
			.style("padding-top","50px")
			.style("margin-right","100px")
			.attr("width",400)
			.attr("height",600)
			.attr("class","div_table_single");
		createTable(genediv,"single_table",scResultListFR);
	}
}


//show mouseover pop

var showmouseover=function(node){
	newWLC = open('','_blank','height=600,width=800,left=800,top=200,scrollbars=yes');
	newWLC.document.write("<body></body>");
	
	var showcut;
	showcut=20;
	var etf=JSON.parse(JSON.stringify(node.ETF));
	var row=etf[0];
	var rowT1="TF	Num Total	Num Parent	Num Path	Expect Overall	Diff. Overall	Score Overall	Expect Split	Diff. Split	Score Split	% Split";
	var rowT2="TF	Num Total	Num Path	Expect Overall	Diff. Overall	Score Overall";
	var cetf=[];
	if (row.length==rowT1.split("\t").length){
		cetf.push(rowT1.split("\t"));
	}
	
	if (row.length==rowT2.split("\t").length){
		cetf.push(rowT2.split("\t"));
	}
	
	for (var i=0;i<showcut;i++){
		etf[i][0]=etf[i][0].split(" ")[0];
		cetf.push(etf[i]);
	}
	
	var genediv=d3.select(newWLC.document.body)
		.style("background","white")
		.append("div")
		.style("padding-left","50px")
		.style("padding-top","50px")
		.attr("width",400)
		.attr("height",600);
	createTFTable(genediv,"tftable",cetf,exploregene,node.depth);
	d3.event.preventDefault();
};

//single cell dropdown on change
var singlecelldropdownonchange=function(){
	var celltype=this.value;
	document.getElementById("singleCellType").value=celltype;
	exploresinglecell(celltype);
}

//sorted cell dropdown on change

var sortedcelldropdownonchange=function(){
	var celltype=this.value;
	document.getElementById("sortedCellType").value=celltype;
	exploresortedcell(celltype);
}


//tf dropdown menu on change
var tfdropdownonchange=function(){
	var tf=this.value;
	document.getElementById("tfName").value=tf;
	exploretf(tf);
}

//click dropdown menu on change

var clickdropdownonchange=function(){
	
};

//explore path

var explorepath=function(){
	
	// generate data X for visualization 
	var PathLabel=nodes[0].path.split(",");
	var allpath=[];
	for (var path of PathLabel){
		var PathList=[];
		for (var node of nodes){
			if (node.path.indexOf(path)!=-1){
				PathList.push(node)
			}
		}
		allpath.push(PathList);
	}
	var pathX=[]
	var LT=allpath[0].length;
	for (var t=0;t<LT;t++){
		var ext=[timePoints[t]];
		for (var path of allpath){
			ext.push(path[t].nodeMean);
		}
		pathX.push(ext);
	}
	var xcols=[];
	
	/*
	for (var di=0;di<allpath.length;di++){
		var chr=String.fromCharCode(65+di)
		xcols.push(chr);
	}
	* */
	var newW2 = open('','_blank','height=800,width=1000,left=1000,top=200,scrollbars=yes');
	newW2.document.write("<head><link rel='stylesheet' type='text/css' href='style.css'></head><body></body>");
	var geneplotdiv=d3.select(newW2.document.body).append("div");
}


//highlightPath on click

var highlightPath=function(){
	d3.select(this.ownerSVGElement).selectAll('path')
	.attr("stroke-width",3);
	var thisIndex=d3.select(this.ownerSVGElement).selectAll('path')[0].indexOf(this);
	
	d3.select(this)
	.attr("stroke-width",5);
	
	d3.select(this.ownerSVGElement).selectAll('text')
	.style("font-size",function(d,i){
		if (i==thisIndex){
			return '20px';
		}return '12px';
	});
}

//explore single cell
var exploresinglecell=function(celltype){
	resetNode2();
	if (celltype===undefined){
		var celltype=d3.select("#singleCellType").property("value").toUpperCase();
	}
	celltype=celltype.toUpperCase();
	
	var N=exgene.length;
	var AllNodes=d3.select("svg").selectAll("g.node")[0];
	var scResultList=[];
	var allTimes=[];
	for (var node of AllNodes){
		if (allTimes.indexOf(node.__data__.nodetime)==-1){
			allTimes.push(node.__data__.nodetime);
		}
	}
	
	for (var cell of singleCells){
		var cell_time=cell[0];
		var cell_type=cell[1].toUpperCase();
		var cell_target=cell[2].split(",").map(function(d){return d.toUpperCase();});
		cell_target=cell_target.filter(function(d){
				if (exgene.indexOf(d)!=-1){
					return true;
				}else{
					return false;
				}
			});
		if (cell_type==celltype){
			var p=cell_target.length*1.0/N;
			var pv_cut=0.05;
			var timeNodes=[];
			if (allTimes.indexOf(cell_time)!=-1){
				for (var node of AllNodes){
					if (node.__data__.nodetime==cell_time){
						timeNodes.push(node);
					}
				}
			} else{
				timeNodes=AllNodes;
			}
			
			for (var node of timeNodes){
				if(node.__data__.nodetime == 28){
				var ov_tar=cell_target.filter(function(d){
					if (node.__data__.genes.indexOf(d)!=-1){
						return true;
					}else{
						return false;
					}
				});	
				var pv=1-pbinom(ov_tar.length-1,node.__data__.genes.length,p);
				if (pv<pv_cut){
					scResultList.push([node,pv,ov_tar]);
				}
			}}
		}
	}
	
	var color=d3.scale.linear();
	color.domain([1,2000]);
	color.range(["red","red"]);
	
	var colorLowerBound=600;
	var chosenNodes=scResultList.map(function(d){return d[0];});
	
	for (var ListElement of scResultList){
		var colorValue=ListElement[1];
		if (pv_cut/colorValue>2000){
			colorValue=2000;
		}else{
			colorValue=pv_cut/colorValue;
			colorValue=Math.max(colorLowerBound,colorValue);
		}
		d3.select(ListElement[0]).selectAll("circle")
		.attr("fill",color(colorValue));
	}
	return scResultList;
}

//explore sorted cell
var exploresortedcell=function(celltype){
	resetNode2();
	if (celltype===undefined){
		var celltype=d3.select("#sortedCellType").property("value").toUpperCase();
	}
	celltype=celltype.toUpperCase();
	
	var N=exgene.length;
	var AllNodes=d3.select("svg").selectAll("g.node")[0];
	var scResultList=[];
	var allTimes=[];
	for (var node of AllNodes){
		if (allTimes.indexOf(node.__data__.nodetime)==-1){
			allTimes.push(node.__data__.nodetime);
		}
	}
	
	for (var cell of sortedCells){
		var cell_time=cell[0];
		var cell_type=cell[1].toUpperCase();
		var cell_target=cell[2].split(",").map(function(d){return d.toUpperCase();});
		cell_target=cell_target.filter(function(d){
				if (exgene.indexOf(d)!=-1){
					return true;
				}else{
					return false;
				}
			});
		if (cell_type==celltype){
			var p=cell_target.length*1.0/N;
			var pv_cut=0.05;
			var timeNodes=[];
			if (allTimes.indexOf(cell_time)!=-1){
				for (var node of AllNodes){
					if (node.__data__.nodetime==cell_time){
						timeNodes.push(node);
					}
				}
			} else{
				timeNodes=AllNodes;
			}
			
			for (var node of timeNodes){
				var ov_tar=cell_target.filter(function(d){
					if (node.__data__.genes.indexOf(d)!=-1){
						return true;
					}else{
						return false;
					}
				});	
				var pv=1-pbinom(ov_tar.length-1,node.__data__.genes.length,p);
				if (pv<pv_cut){
					scResultList.push([node,pv,ov_tar]);
				}
			}
		}
	}
	
	var color=d3.scale.linear();
		color.domain([1,2000]);
		color.range(["white","red"]);
	
	var colorLowerBound=600;
	var chosenNodes=scResultList.map(function(d){return d[0];});
	
	for (var ListElement of scResultList){
		var colorValue=ListElement[1];
		if (pv_cut/colorValue>2000){
			colorValue=2000;
		}else{
			colorValue=pv_cut/colorValue;
			colorValue=Math.max(colorLowerBound,colorValue);
		}
		d3.select(ListElement[0]).selectAll("circle")
		.attr("fill",color(colorValue));
	}
	return scResultList;
}

//wild explore regulator targets
var wildexploretftargets=function(tfinput){
	if (tfinput==undefined){
		var tfinput=d3.select("#tfTarget").property("value");
	}
	tfinput=tfinput.toUpperCase();
	var GeneList=[];
	var localReg=reg.map(function(d){return d.toUpperCase();});
	for(var gi of localReg){
		if (gi.indexOf(tfinput)!=-1){
			GeneList.push([gi]);
		}
	}
	
	if (GeneList.length==1 && GeneList[0]==tfinput){
		exploretftarget(tfinput);
	} else{
		newWWG = open('','_blank','height=600,width=800,left=1400,top=200,scrollbars=yes');
		newWWG.document.write("<body>matches </body>");
		
		var genediv=d3.select(newWWG.document.body)
			.style("background","white")
			.append("div")
			.style("padding-left","50px")
			.style("padding-top","50px")
			.attr("width",400)
			.attr("height",600);
		createTable(genediv,"mtable",GeneList,exploretftarget);
	}	
}


// explore regulator target
var exploretftarget=function(tfinput,geneplotdiv){
	if (tfinput===undefined){
		var tfinput=d3.select("#tfName").property("value").toUpperCase();
	}
	tfinput=tfinput.toUpperCase();
	var tftargets=regTargetMap[tfinput];
	var targetexList=[];
	for (var target of tftargets){
		var targetIndex=exgene.indexOf(target);
		var targetex=genex[targetIndex];
		targetexList.push(targetex);
	}
	
	var avt=[];
	for (var i=0;i<targetexList[0].length;i++){
		var avi=[];
		for (var target of targetexList){
			avi.push(target[i]);
		}
		var sumi=avi.reduce(function(a,b){return a+b;},0);
		sumi=(sumi/avi.length);
		var ti=timePoints[i];
		avt.push([ti,sumi]);
	}
	
	if (geneplotdiv==undefined){
		var newW2 = open('','_blank','height=800,width=1000,left=1000,top=200,scrollbars=yes');
		newW2.document.write("<head><link rel='stylesheet' type='text/css' href='style.css'></head><body></body>");
		geneplotdiv=d3.select(newW2.document.body).append("div");
	}
	
	//gplotData(geneplotdiv,"",avt,"Avg. Expression of "+tfinput+" targets");
}


//wild explore regulator
var wildexploretf=function(tfinput){
	if (tfinput===undefined){
		var tfinput=d3.select("#tfName").property("value").toUpperCase();
	}
	tfinput=tfinput.toUpperCase();
	
	var GeneList=[];
	var localReg=reg.map(function(d){return d.toUpperCase();});
	for(var gi of localReg){
		if (gi.indexOf(tfinput)!=-1){
			GeneList.push([gi]);
		}
	}
	
	if (GeneList.length==1 && GeneList[0]==tfinput){
		exploretf(tfinput);
	} else{
		newWWG = open('','_blank','height=600,width=800,left=1400,top=200,scrollbars=yes');
		newWWG.document.write("<body>matches </body>");
		
		var genediv=d3.select(newWWG.document.body)
			.style("background","white")
			.append("div")
			.style("padding-left","50px")
			.style("padding-top","50px")
			.attr("width",400)
			.attr("height",600)
			.attr("class","div_matched_tfs");
		createTable(genediv,"mtable",GeneList,exploretf);
	}
}


//explore regulator
var exploretf=function(tfinput){
	if (tfinput===undefined){
		var tfinput=d3.select("#tfName").property("value").toUpperCase();
	}else{
		document.getElementById("tfName").value=tfinput;
	}
	tfinput=tfinput.toUpperCase();
	var paths=d3.select("svg").selectAll("path")[0];
	var tfNodeList=getNodeListReg(tfinput);
	var pathList=getPathListReg(tfinput);
	d3.selectAll(pathList)
	.attr("class","link")
	.attr("stroke-width","15px");
};

// wild search gene 
var wildexploregene=function(geneinput){
	var GeneList=[];
	
	if (geneinput==undefined){
		var geneinput=d3.select("#deName").property("value").toUpperCase();
	}else{
		geneinput=geneinput.toUpperCase();
	}

	for(var gi of exgene){
		if (gi.indexOf(geneinput)!=-1){
			GeneList.push([gi]);
		}
	}
	if (GeneList.length==1 && GeneList[0]==geneinput){
		var newW2 = open('','_blank','height=800,width=1000,left=1000,top=200,scrollbars=yes');
		newW2.document.write("<head><link rel='stylesheet' type='text/css' href='style.css'></head><body></body>");
		geneplotdiv=d3.select(newW2.document.body).append("div");	
		exploregene(geneinput,geneplotdiv);
	}else{
		newWWG = open('','_blank','height=600,width=800,left=1400,top=200,scrollbars=yes');
		newWWG.document.write("<body>matches </body>");
		
		var genediv=d3.select(newWWG.document.body)
			.style("background","white")
			.append("div")
			.style("padding-left","50px")
			.style("padding-top","50px")
			.attr("width",400)
			.attr("height",600)
			.attr("class","div_matched_genes");
		createTable(genediv,"mgenetable",GeneList,exploregene);
	}
}


//explore gene
var exploregene=function(geneinput,geneplotdiv){
	resetPath2();
	resetNode2();
	if (geneinput==undefined){
		var geneinput=d3.select("#deName").property("value").toUpperCase();
	}else{
		geneinput=geneinput.toUpperCase();
	}
	
	var pathList=getPathList(geneinput);
	d3.selectAll(pathList)
	.attr("class","link")
	.attr("stroke-width","15px");

	
	/*var nodeListSelect=getNodeList(geneinput);
	d3.selectAll(nodeListSelect)
	.append("text")
	.attr("class","nodeExText")
	.text(function(d){
		var geneIndex=exgene.indexOf(geneinput);
		var exVal=(d.nodeMean).toFixed(2);
		return exVal;
		})
	.attr("x",-10)
	.attr("fill","black")
	.style("font-size","10px");*/
	
	var xgene=[];
	var geneIndex=exgene.indexOf(geneinput);
	var xg=genex[geneIndex];
	for(var t=0;t<timePoints.length;t++){
		xgene.push([timePoints[t],xg[t]]);
	}
	
	//gplotData(geneplotdiv,geneinput,xgene,"expression of "+geneinput);
};




/*global function section*/

//get node list for a regulator 

var getNodeListReg=function(reg){
	var AllNodeList=d3.select("svg").selectAll("g.node")[0];
	var selectNodeList=[];
	//var tfcut=document.getElementById("tfcutSelector").innerHTML;
	tfcut=20;
	
	for (var node of AllNodeList){
		var node_regs=node.__data__.ETF;
		var regList=[];
		if (node_regs){
			for (var i=0;i<tfcut;i++){
				regList.push(node_regs[i][0].split(" ")[0].toUpperCase());
			}
		}
		if (regList.indexOf(reg)!=-1){
			selectNodeList.push(node);
		}
	}
	return selectNodeList;
};


//get path list for a regulator

var getPathListReg=function(reg){
	//var tfcut=document.getElementById("tfcutSelector").innerHTML;
	tfcut=20;
	var paths=d3.select("svg").selectAll("path")[0];
	var pathList=[];
	for (var path of paths){
		var target=path.__data__.target;
		var node_regs=target.ETF;
		var regList=[];
		if (node_regs){
			for (var i=0;i<tfcut;i++){
				regList.push(node_regs[i][0].split(" ")[0].toUpperCase());
			}
		}
		if (regList.indexOf(reg)!=-1){
			pathList.push(path);
		}
	}
	return pathList;
}

//get node list for a gene
var getNodeList=function(gene){
	var AllnodeList=d3.select("svg").selectAll("g.node")[0];
	var selectNodeList=[];
	for (var node of AllnodeList){
		node_genes=node.__data__.genes;
		if (node_genes.indexOf(gene)!=-1){
			selectNodeList.push(node);
		}
		if (node.__data__.nodeID==0){
			selectNodeList.push(node);
		}
	}
	
	return  selectNodeList;
}


//get path List for a gene
var getPathList=function(gene){
	var paths=d3.select("svg").selectAll("path")[0];
	var pathList=[];
	for (var path of paths){
		var target=path.__data__.target;
		var target_genes=target.genes;
		if (target_genes.indexOf(gene)!=-1){
			pathList.push(path);
		}
	}
	return pathList;
};

//create a dropdown menu

var createDropDown=function(FirstRow,tfdropdowndiv,dropdownid,TFs,onChange){
	var Keys=[FirstRow];
	TFs.sort();
	for (var tf of TFs){
		Keys.push(tf);
	}
	
	d3.select(tfdropdowndiv)
	.select("select")
	.remove();
	
	d3.select(tfdropdowndiv)
	.append("select")
	.attr("id",dropdownid)
	.on("change",onChange)
	.selectAll("option")
	.data(Keys)
	.enter()
	.append("option")
	.text(function(d){
		return d;
	})
	.attr("value",function(d){
		return d;
		});
	
}

//append a table to the cant
var createTFTable=function(cant,tableid,data,responseFunction,depth){
	cant.append("table")
	.attr("id",tableid)
	.style("border","1px solid")
	.style("border-collapse","collapse")
	.selectAll("tr")
	.data(data)
	.enter()
	.append("tr")
	.style("border","1px solid transparent")
	.style("height","30px")
	.style("transition", "all 0.3s")
	.style("background", function(d,i){
		if (i==0){
			return "#DFDFDF";
		}else if (i%2==0){
			return "#F1F1F1";
		} return "#FEFEFE";
		
	})
	.style("font-weight",function(d,i){
		if (i==0){
			return "bold";
		}
	})
	.style("color",function(d){
			var geneIndex=exgene.indexOf(d[0].split(" ")[0].toUpperCase());
			if (geneIndex==-1){
				geneIndex=mirID.indexOf(d[0].split(" ")[0].toUpperCase());
				var gvalue=mirex[geneIndex];
			}else{
				var gvalue=genex[geneIndex];
			}
			if (gvalue!=undefined){
				gvalue=gvalue[depth];
			}
			
			if (gvalue>0){
				return "blue";
			}else if (gvalue<0){
				return "red";
			}else if (gvalue==0){
				return "silver";
			}else{
				return "gray";
			}
		})
	.selectAll("td")
	.data(function(d){return d;})
	.enter()
	.append("td")
	.style("border","1px dotted")
	.text(function(d){return d;})
	.on("click",function(d){
			var key=d.split(" ")[0];
			if(mirID.indexOf(key)!=-1){
				exploremir(key);
			}else{
				exploregene(key);
			}
		});
	return cant;
};


//append a table to the cant
var createTable=function(cant,tableid,data,responseFunction){
	cant.append("table")
	.attr("id",tableid)
	//.style("border","1px solid")
	.style("border-collapse","collapse")
	.style("color","#333")
	.style("font-family","Helvetica, Arial, sans-serif")
	.style("border-spacing","0")
	.selectAll("tr")
	.data(data)
	.enter()
	.append("tr")
	.style("border","1px solid transparent")
	.style("height","30px")
	.style("transition", "all 0.3s")
	.style("background", function(d,i){
		if (i==0){
			return "#DFDFDF";
		}else if (i%2==0){
			return "#F1F1F1";
		} return "#FEFEFE";
		
	})
	.style("font-weight",function(d,i){
		if (i==0){
			return "bold";
		}
	})
	.selectAll("td")
	.data(function(d){return d;})
	.enter()
	.append("td")
	.style("border","1px dotted")
	.text(function(d){return d;})
	.on("click",function(d){
			responseFunction(d);
		});
	return cant;
};


//Math functions
var erf=function(z){
	var t = 1.0 / (1.0 + 0.5 * Math.abs(z));
	var ans = 1 - t * Math.exp( -z*z -  1.26551223 +
											t * ( 1.00002368 +
											t * ( 0.37409196 + 
											t * ( 0.09678418 + 
											t * (-0.18628806 + 
											t * ( 0.27886807 + 
											t * (-1.13520398 + 
											t * ( 1.48851587 + 
											t * (-0.82215223 + 
											t * ( 0.17087277))))))))));
	if (z > 0.0){
			return ans;
	}else{
			return -ans
	}

}

//pbinom
var pbinom=function(s, n, p){
    var u = n * p;
    var o=Math.pow(u*(1-p),0.5);
    //var out=0.5*(1+erf((s-u)/(Math.pow(o*2,0.5))));
    var out=0.5*(1+erf((s-u)/(o*Math.pow(2,0.5))));
    return out;
}

//Gaussian probability

var NormProb=function(x,mean,standardDeviation){
	if (standardDeviation==0){
		return 0;
	}
    return -1*Math.log(Math.pow(2*Math.PI*standardDeviation * standardDeviation,-0.5)*Math.pow(Math.E, -Math.pow(x - mean, 2) / (2 * (standardDeviation * standardDeviation))));
}

//nodeCompare
var nodeCompare=function(nodeA,nodeB){
	
	if (nodeA.nodeMean<nodeB.nodeMean){
		return 1;
	}else if (nodeA.nodeMean>nodeB.nodeMean){
		return -1;
	}else{
		return 0;
	}
}

//

var createjsondownload=function(jsondownloadlinkid){
	 //var dataObj=JSON.parse(data);
	 //var outObj={"GeneList":dataObj[0], "CellList":dataObj[1], "NodeList":dataObj[2],"EdgeList":dataObj[3]};
	 var rawObj=data[0];
	 var outObj=[];
	 for (var e of rawObj){
		 var ue={"id":e["id"],"nodetime":e["nodetime"],"nodeMean":e["nodeMean"],"nodeSigma":e["nodeSigma"],"ETF":e["ETF"],"genes":e["genes"]};
		 outObj.push(ue);
	 }
	 var outObjStr=JSON.stringify(outObj,null,"	");
	 var blob=new Blob([outObjStr],{type:'application/json;charset=utf-8'});
	 outurl=window.URL.createObjectURL(blob);
	 d3.select("#"+jsondownloadlinkid)
	.attr("href",outurl)
	.attr("download","download.json")
	.text("Ready,Click to download");
}
	
var downloadjson=function(jsondownloadlinkid){
			plswait(jsondownloadlinkid);
			window.setTimeout(function(){createjsondownload(jsondownloadlinkid);},10);
}

function plswait(id){
		document.getElementById(id).innerHTML="wait...";
		d3.select("#"+id)
		.text("Generating file,please wait...");	
}

