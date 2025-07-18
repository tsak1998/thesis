/**
 * @author mrdoob / http://mrdoob.com/
 */

var Sidebar = function ( editor ) {

	var strings = editor.strings;

	var container = new UI.Panel();
	container.setId( 'sidebar' );
	//

	var modelTab = new UI.Text( strings.getKey( 'sidebar/model' ) ).setTextTransform( 'uppercase' );
	modelTab.onClick( function () { select( 'MODEL' ) } );

	var nodesTab = new UI.Text( strings.getKey( 'sidebar/project' ) ).setTextTransform( 'uppercase' );
	nodesTab.onClick( function () { select( 'NODES' ) } );
	
	var elementsTab = new UI.Text( 'ELEMENTS' ).setTextTransform( 'uppercase' );
	elementsTab.onClick( function () { select( 'ELEMENTS' ) } );


	var supportsTab = new UI.Text( 'supports' ).setTextTransform( 'uppercase' );
	supportsTab.onClick( function () { select( 'SUPPORTS' ) } );

	var materialsTab = new UI.Text( 'materials' ).setTextTransform( 'uppercase' );
	materialsTab.onClick( function () { select( 'MATERIALS' ) } );

	var sectionsTab = new UI.Text( 'sections' ).setTextTransform( 'uppercase' );
	sectionsTab.onClick( function () { select( 'SECTIONS' ) } );

	var pointLoadsTab = new UI.Text( 'point loads' ).setTextTransform( 'uppercase' );
	pointLoadsTab.onClick( function () { select( 'POINT LOADS' ) } );

	var distLoadsTab = new UI.Text( 'dist loads' ).setTextTransform( 'uppercase' );
	distLoadsTab.onClick( function () { select( 'DIST LOADS' ) } );

	var resultsTab = new UI.Text( 'results' ).setTextTransform( 'uppercase' );
	resultsTab.onClick( function () { select( 'RESULTS' ) } );

	var settingsTab = new UI.Text( strings.getKey( 'sidebar/settings' ) ).setTextTransform( 'uppercase' );
	settingsTab.onClick( function () { select( 'SETTINGS' ) } );

	var tabs = new UI.Div();
	tabs.setId( 'tabs' );
	tabs.add( modelTab, nodesTab, materialsTab, sectionsTab, elementsTab, supportsTab, pointLoadsTab, distLoadsTab, resultsTab, settingsTab );
	container.add( tabs );

	//

	var model = new UI.Span().add(
		new Sidebar.Scene( editor ),
		new Sidebar.Properties( editor ),
	
	);
	container.add( model );


	var nodes = new UI.Span().add(
		new Sidebar.Nodes( editor )
	);
	container.add( nodes );

	var materials = new UI.Span().add(
		new Sidebar.Materials( editor )
	);
	container.add( materials );

	var sections = new UI.Span().add(
		new Sidebar.Sections( editor )
	);
	container.add( sections );
	
	var elements = new UI.Span().add(
		new Sidebar.Elements.Modern( editor )
	);
	container.add( elements );
	
	var supports = new UI.Span().add(
		new Sidebar.Supports( editor )
	);
	container.add( supports );

	
	var pointLoads = new UI.Span().add(
		new Sidebar.PointLoads( editor )
	);

	container.add( pointLoads );

	var distLoads = new UI.Span().add(
		new Sidebar.DistLoads( editor )
	);

	container.add( distLoads );
	
	var results = new UI.Span().add(
		new Sidebar.Results( editor ),
	);
	container.add( results );

	var settings = new UI.Span().add(
		new Sidebar.Settings( editor ),
		new Sidebar.History( editor )
	);
	container.add( settings );

	//

	function select( section ) {

		modelTab.setClass( '' );
		nodesTab.setClass( '' );
		elementsTab.setClass( '' );
		supportsTab.setClass( '' );
		materialsTab.setClass( '' );
		sectionsTab.setClass( '' );
		pointLoadsTab.setClass( '' );
		distLoadsTab.setClass( '' );
		resultsTab.setClass( '' );
		settingsTab.setClass( '' );

		model.setDisplay( 'none' );
		nodes.setDisplay( 'none' );
		elements.setDisplay( 'none' );
		supports.setDisplay( 'none' );
		materials.setDisplay( 'none' );
		sections.setDisplay( 'none' );
		pointLoads.setDisplay( 'none' );
		distLoads.setDisplay( 'none' );
		results.setDisplay( 'none' );
		settings.setDisplay( 'none' );

		switch ( section ) {
			case 'MODEL':
				modelTab.setClass( 'selected' );
				model.setDisplay( '' );
				break;
			case 'NODES':
				nodesTab.setClass( 'selected' );
				nodes.setDisplay( '' );
				break;
			case 'MATERIALS':
				materialsTab.setClass( 'selected' );
				materials.setDisplay( '' );
				break;
			case 'SECTIONS':
				sectionsTab.setClass( 'selected' );
				sections.setDisplay( '' );
				break;
			case 'ELEMENTS':
				elementsTab.setClass( 'selected' );
				elements.setDisplay( '' );
				break;
			case 'SUPPORTS':
				supportsTab.setClass( 'selected' );
				supports.setDisplay( '' );
				break;
			
			case 'POINT LOADS':
				pointLoadsTab.setClass( 'selected' );
				pointLoads.setDisplay( '' );
				break;
			case 'DIST LOADS':
				distLoadsTab.setClass( 'selected' );
				distLoads.setDisplay( '' );
				break;
			case 'RESULTS':
				resultsTab.setClass( 'selected' );
				results.setDisplay( '' );
				break;
			case 'SETTINGS':
				settingsTab.setClass( 'selected' );
				settings.setDisplay( '' );
				break;
		}

	}

	select( 'SCENE' );

	return container;

};
