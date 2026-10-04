//#region src/rndt/constants.ts
/** Plugin id; must match the bundle's `plugin.json`. */
var PLUGIN_ID = "openrndt-geolibre";
var PLUGIN_NAME = "RNDT catalogue";
/** Title of the panel and label of the toolbar menu. */
var PLUGIN_LABEL = "RNDT";
var PLUGIN_VERSION = "0.2.0";
/** Right-panel id, unique across plugins. */
var PANEL_ID = `${PLUGIN_ID}-search`;
/** RNDT REST base URL (same default as the openrndt CLI). */
var RNDT_BASE_URL = "https://geodati.gov.it/RNDT";
/** Extent of Italy (west, south, east, north), islands included. */
var ITALY_BBOX = [
	6.6,
	35.4,
	18.6,
	47.1
];
/**
* Features a WFS download takes without asking. Above it the panel asks the
* user whether to download them all (slow, memory) or only this many.
*/
var WFS_MAX_FEATURES = 1e4;
/**
* INSPIRE themes. `value` is the Italian label stored in `INSPIRETheme_s`
* (case- and accent-sensitive), `label` the English name shown in the panel.
* All 34 values verified against the live catalogue on 2026-09-26.
*/
var INSPIRE_THEMES = [
	{
		value: "Indirizzi",
		label: "Addresses"
	},
	{
		value: "Unità amministrative",
		label: "Administrative units"
	},
	{
		value: "Impianti agricoli e di acquacoltura",
		label: "Agricultural and aquaculture facilities"
	},
	{
		value: "Zone sottoposte a gestione/limitazioni/regolamentazione e unità con obbligo di comunicare dati",
		label: "Area management/restriction/regulation zones and reporting units"
	},
	{
		value: "Condizioni atmosferiche",
		label: "Atmospheric conditions"
	},
	{
		value: "Regioni biogeografiche",
		label: "Bio-geographical regions"
	},
	{
		value: "Edifici",
		label: "Buildings"
	},
	{
		value: "Parcelle catastali",
		label: "Cadastral parcels"
	},
	{
		value: "Sistemi di coordinate",
		label: "Coordinate reference systems"
	},
	{
		value: "Elevazione",
		label: "Elevation"
	},
	{
		value: "Risorse energetiche",
		label: "Energy resources"
	},
	{
		value: "Impianti di monitoraggio ambientale",
		label: "Environmental monitoring facilities"
	},
	{
		value: "Sistemi di griglie geografiche",
		label: "Geographical grid systems"
	},
	{
		value: "Nomi geografici",
		label: "Geographical names"
	},
	{
		value: "Geologia",
		label: "Geology"
	},
	{
		value: "Habitat e biotopi",
		label: "Habitats and biotopes"
	},
	{
		value: "Salute umana e sicurezza",
		label: "Human health and safety"
	},
	{
		value: "Idrografia",
		label: "Hydrography"
	},
	{
		value: "Copertura del suolo",
		label: "Land cover"
	},
	{
		value: "Utilizzo del territorio",
		label: "Land use"
	},
	{
		value: "Elementi geografici meteorologici",
		label: "Meteorological geographical features"
	},
	{
		value: "Risorse minerarie",
		label: "Mineral resources"
	},
	{
		value: "Zone a rischio naturale",
		label: "Natural risk zones"
	},
	{
		value: "Elementi geografici oceanografici",
		label: "Oceanographic geographical features"
	},
	{
		value: "Orto immagini",
		label: "Orthoimagery"
	},
	{
		value: "Distribuzione della popolazione — demografia",
		label: "Population distribution - demography"
	},
	{
		value: "Produzione e impianti industriali",
		label: "Production and industrial facilities"
	},
	{
		value: "Siti protetti",
		label: "Protected sites"
	},
	{
		value: "Regioni marine",
		label: "Sea regions"
	},
	{
		value: "Suolo",
		label: "Soil"
	},
	{
		value: "Distribuzione delle specie",
		label: "Species distribution"
	},
	{
		value: "Unità statistiche",
		label: "Statistical units"
	},
	{
		value: "Reti di trasporto",
		label: "Transport networks"
	},
	{
		value: "Servizi di pubblica utilità e servizi amministrativi",
		label: "Utility and governmental services"
	}
];
/**
* The INSPIRE short code of each theme (`hy` for Idrografia), as a link
* writes it: shorter than the label and the same in every language. Read from
* the INSPIRE registry (https://inspire.ec.europa.eu/theme/theme.it.json) on
* 2026-10-04; every label matches a value of INSPIRE_THEMES.
*/
var INSPIRE_THEME_CODES = {
	ac: "Condizioni atmosferiche",
	ad: "Indirizzi",
	af: "Impianti agricoli e di acquacoltura",
	am: "Zone sottoposte a gestione/limitazioni/regolamentazione e unità con obbligo di comunicare dati",
	au: "Unità amministrative",
	br: "Regioni biogeografiche",
	bu: "Edifici",
	cp: "Parcelle catastali",
	ef: "Impianti di monitoraggio ambientale",
	el: "Elevazione",
	er: "Risorse energetiche",
	ge: "Geologia",
	gg: "Sistemi di griglie geografiche",
	gn: "Nomi geografici",
	hb: "Habitat e biotopi",
	hh: "Salute umana e sicurezza",
	hy: "Idrografia",
	lc: "Copertura del suolo",
	lu: "Utilizzo del territorio",
	mf: "Elementi geografici meteorologici",
	mr: "Risorse minerarie",
	nz: "Zone a rischio naturale",
	of: "Elementi geografici oceanografici",
	oi: "Orto immagini",
	pd: "Distribuzione della popolazione — demografia",
	pf: "Produzione e impianti industriali",
	ps: "Siti protetti",
	rs: "Sistemi di coordinate",
	sd: "Distribuzione delle specie",
	so: "Suolo",
	sr: "Regioni marine",
	su: "Unità statistiche",
	tn: "Reti di trasporto",
	us: "Servizi di pubblica utilità e servizi amministrativi"
};
/** INSPIRE spatial data service types (`apiso_ServiceType_s`). */
var SERVICE_TYPES$1 = [
	{
		value: "view",
		label: "View (WMS, WMTS)"
	},
	{
		value: "download",
		label: "Download (WFS, ATOM)"
	},
	{
		value: "discovery",
		label: "Discovery (CSW)"
	},
	{
		value: "transformation",
		label: "Transformation"
	},
	{
		value: "invoke",
		label: "Invoke"
	},
	{
		value: "other",
		label: "Other"
	}
];
/** Fields the free text can be restricted to ("Ricerca tra" on the portal). */
var SEARCH_FIELDS = [
	{
		value: "",
		label: "Anywhere"
	},
	{
		value: "title",
		label: "Title"
	},
	{
		value: "description",
		label: "Abstract"
	},
	{
		value: "apiso_Lineage_txt",
		label: "Lineage"
	},
	{
		value: "apiso_AccessConstraints_s",
		label: "Use limitation"
	}
];
var DATE_FIELDS$1 = [
	{
		value: "apiso_RevisionDate_dt",
		label: "Revision"
	},
	{
		value: "apiso_PublicationDate_dt",
		label: "Publication"
	},
	{
		value: "apiso_CreationDate_dt",
		label: "Creation"
	},
	{
		value: "sys_created_dt",
		label: "Added to catalogue"
	}
];
var SORT_OPTIONS = [
	{
		value: "",
		label: "Relevance"
	},
	{
		value: "title:asc",
		label: "Title A-Z"
	},
	{
		value: "title:desc",
		label: "Title Z-A"
	},
	{
		value: "apiso_Modified_dt:desc",
		label: "Metadata date, newest first"
	},
	{
		value: "apiso_Modified_dt:asc",
		label: "Metadata date, oldest first"
	}
];
//#endregion
//#region node_modules/proj4/lib/global.js
function global_default(defs) {
	defs("EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
	defs("EPSG:4269", "+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees");
	defs("EPSG:3857", "+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs");
	for (var i = 1; i <= 60; ++i) {
		defs("EPSG:" + (32600 + i), "+proj=utm +zone=" + i + " +datum=WGS84 +units=m");
		defs("EPSG:" + (32700 + i), "+proj=utm +zone=" + i + " +south +datum=WGS84 +units=m");
	}
	defs("EPSG:5041", "+title=WGS 84 / UPS North (E,N) +proj=stere +lat_0=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m");
	defs("EPSG:5042", "+title=WGS 84 / UPS South (E,N) +proj=stere +lat_0=-90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m");
	defs.WGS84 = defs["EPSG:4326"];
	defs["EPSG:3785"] = defs["EPSG:3857"];
	defs.GOOGLE = defs["EPSG:3857"];
	defs["EPSG:900913"] = defs["EPSG:3857"];
	defs["EPSG:102113"] = defs["EPSG:3857"];
}
//#endregion
//#region node_modules/proj4/lib/constants/values.js
var SRS_WGS84_SEMIMAJOR = 6378137;
var SRS_WGS84_SEMIMINOR = 6356752.314;
var SRS_WGS84_ESQUARED = .0066943799901413165;
var SEC_TO_RAD = 484813681109536e-20;
var HALF_PI = Math.PI / 2;
var SIXTH = .16666666666666666;
var RA4 = .04722222222222222;
var RA6 = .022156084656084655;
var EPSLN = 1e-10;
var D2R$1 = .017453292519943295;
var R2D = 57.29577951308232;
var FORTPI = Math.PI / 4;
var TWO_PI = Math.PI * 2;
var SPI = 3.14159265359;
//#endregion
//#region node_modules/proj4/lib/constants/PrimeMeridian.js
var primeMeridian = {};
primeMeridian.greenwich = 0;
primeMeridian.lisbon = -9.131906111111;
primeMeridian.paris = 2.337229166667;
primeMeridian.bogota = -74.080916666667;
primeMeridian.madrid = -3.687938888889;
primeMeridian.rome = 12.452333333333;
primeMeridian.bern = 7.439583333333;
primeMeridian.jakarta = 106.807719444444;
primeMeridian.ferro = -17.666666666667;
primeMeridian.brussels = 4.367975;
primeMeridian.stockholm = 18.058277777778;
primeMeridian.athens = 23.7163375;
primeMeridian.oslo = 10.722916666667;
//#endregion
//#region node_modules/proj4/lib/constants/units.js
var units_default = {
	mm: { to_meter: .001 },
	cm: { to_meter: .01 },
	ft: { to_meter: .3048 },
	"us-ft": { to_meter: 1200 / 3937 },
	fath: { to_meter: 1.8288 },
	kmi: { to_meter: 1852 },
	"us-ch": { to_meter: 20.1168402336805 },
	"us-mi": { to_meter: 1609.34721869444 },
	km: { to_meter: 1e3 },
	"ind-ft": { to_meter: .30479841 },
	"ind-yd": { to_meter: .91439523 },
	mi: { to_meter: 1609.344 },
	yd: { to_meter: .9144 },
	ch: { to_meter: 20.1168 },
	link: { to_meter: .201168 },
	dm: { to_meter: .1 },
	in: { to_meter: .0254 },
	"ind-ch": { to_meter: 20.11669506 },
	"us-in": { to_meter: .025400050800101 },
	"us-yd": { to_meter: .914401828803658 }
};
//#endregion
//#region node_modules/proj4/lib/match.js
var ignoredChar = /[\s_\-\/\(\)]/g;
function match(obj, key) {
	if (obj[key]) return obj[key];
	var keys = Object.keys(obj);
	var lkey = key.toLowerCase().replace(ignoredChar, "");
	var i = -1;
	var testkey, processedKey;
	while (++i < keys.length) {
		testkey = keys[i];
		processedKey = testkey.toLowerCase().replace(ignoredChar, "");
		if (processedKey === lkey) return obj[testkey];
	}
}
//#endregion
//#region node_modules/proj4/lib/projString.js
/**
* @param {string} defData
* @returns {import('./defs').ProjectionDefinition}
*/
function projString_default(defData) {
	/** @type {import('./defs').ProjectionDefinition} */
	var self = {};
	var paramObj = defData.split("+").map(function(v) {
		return v.trim();
	}).filter(function(a) {
		return a;
	}).reduce(function(p, a) {
		/** @type {Array<?>} */
		var split = a.split("=");
		split.push(true);
		p[split[0].toLowerCase()] = split[1];
		return p;
	}, {});
	var paramName, paramVal, paramOutname;
	var params = {
		proj: function(v) {
			self.projName = [
				"lonlat",
				"latlon",
				"latlong"
			].includes(v) ? "longlat" : v;
		},
		datum: "datumCode",
		rf: function(v) {
			self.rf = parseFloat(v);
		},
		lat_0: function(v) {
			self.lat0 = v * D2R$1;
		},
		lat_1: function(v) {
			self.lat1 = v * D2R$1;
		},
		lat_2: function(v) {
			self.lat2 = v * D2R$1;
		},
		lat_ts: function(v) {
			self.lat_ts = v * D2R$1;
		},
		lon_0: function(v) {
			self.long0 = v * D2R$1;
		},
		lon_wrap: function(v) {
			self.long_wrap = parseFloat(v) * D2R$1;
		},
		lon_1: function(v) {
			self.long1 = v * D2R$1;
		},
		lon_2: function(v) {
			self.long2 = v * D2R$1;
		},
		alpha: function(v) {
			self.alpha = parseFloat(v) * D2R$1;
		},
		gamma: function(v) {
			self.rectified_grid_angle = parseFloat(v) * D2R$1;
		},
		lonc: function(v) {
			self.longc = v * D2R$1;
		},
		x_0: function(v) {
			self.x0 = parseFloat(v);
		},
		y_0: function(v) {
			self.y0 = parseFloat(v);
		},
		k_0: function(v) {
			self.k0 = parseFloat(v);
		},
		k: function(v) {
			self.k0 = parseFloat(v);
		},
		a: function(v) {
			self.a = parseFloat(v);
		},
		b: function(v) {
			self.b = parseFloat(v);
		},
		r: function(v) {
			self.a = self.b = parseFloat(v);
		},
		r_a: function() {
			self.R_A = true;
		},
		zone: function(v) {
			self.zone = parseInt(v, 10);
		},
		south: function() {
			self.utmSouth = true;
		},
		towgs84: function(v) {
			self.datum_params = v.split(",").map(function(a) {
				return parseFloat(a);
			});
		},
		to_meter: function(v) {
			self.to_meter = parseFloat(v);
		},
		units: function(v) {
			self.units = v;
			var unit = match(units_default, v);
			if (unit) self.to_meter = unit.to_meter;
		},
		from_greenwich: function(v) {
			self.from_greenwich = v * D2R$1;
		},
		pm: function(v) {
			var pm = match(primeMeridian, v);
			self.from_greenwich = (pm ? pm : parseFloat(v)) * D2R$1;
		},
		nadgrids: function(v) {
			if (v === "@null") self.datumCode = "none";
			else self.nadgrids = v;
		},
		axis: function(v) {
			var legalAxis = "ewnsud";
			if (v.length === 3 && legalAxis.indexOf(v.substr(0, 1)) !== -1 && legalAxis.indexOf(v.substr(1, 1)) !== -1 && legalAxis.indexOf(v.substr(2, 1)) !== -1) self.axis = v;
		},
		approx: function() {
			self.approx = true;
		},
		over: function() {
			self.over = true;
		}
	};
	for (paramName in paramObj) {
		paramVal = paramObj[paramName];
		if (paramName in params) {
			paramOutname = params[paramName];
			if (typeof paramOutname === "function") paramOutname(paramVal);
			else self[paramOutname] = paramVal;
		} else self[paramName] = paramVal;
	}
	if (typeof self.datumCode === "string" && self.datumCode !== "WGS84") self.datumCode = self.datumCode.toLowerCase();
	self["projStr"] = defData;
	return self;
}
//#endregion
//#region node_modules/wkt-parser/PROJJSONBuilder.js
var PROJJSONBuilderBase = class {
	static getId(node) {
		const idNode = node.find((child) => Array.isArray(child) && child[0] === "ID");
		if (idNode && idNode.length >= 3) return {
			authority: idNode[1],
			code: parseInt(idNode[2], 10)
		};
		return null;
	}
	static convertUnit(node, type = "unit") {
		if (!node || node.length < 3) return {
			type,
			name: "unknown",
			conversion_factor: null
		};
		const name = node[1];
		const conversionFactor = parseFloat(node[2]) || null;
		const idNode = node.find((child) => Array.isArray(child) && child[0] === "ID");
		return {
			type,
			name,
			conversion_factor: conversionFactor,
			id: idNode ? {
				authority: idNode[1],
				code: parseInt(idNode[2], 10)
			} : null
		};
	}
	static convertAxis(node) {
		const name = node[1] || "Unknown";
		let direction;
		const abbreviationMatch = name.match(/^\((.)\)$/);
		if (abbreviationMatch) {
			const abbreviation = abbreviationMatch[1].toUpperCase();
			if (abbreviation === "E") direction = "east";
			else if (abbreviation === "N") direction = "north";
			else if (abbreviation === "U") direction = "up";
			else if (node[2]) direction = node[2];
			else throw new Error(`Unknown axis abbreviation: ${abbreviation}`);
		} else direction = node[2] || "unknown";
		const orderNode = node.find((child) => Array.isArray(child) && child[0] === "ORDER");
		const order = orderNode ? parseInt(orderNode[1], 10) : null;
		const unitNode = node.find((child) => Array.isArray(child) && (child[0] === "LENGTHUNIT" || child[0] === "ANGLEUNIT" || child[0] === "SCALEUNIT"));
		const unit = this.convertUnit(unitNode);
		return {
			name,
			direction,
			unit,
			order
		};
	}
	static extractAxes(node) {
		return node.filter((child) => Array.isArray(child) && child[0] === "AXIS").map((axis) => this.convertAxis(axis)).sort((a, b) => (a.order || 0) - (b.order || 0));
	}
	static convert(node, result = {}) {
		switch (node[0]) {
			case "PROJCRS":
				result.type = "ProjectedCRS";
				result.name = node[1];
				result.base_crs = node.find((child) => Array.isArray(child) && child[0] === "BASEGEOGCRS") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "BASEGEOGCRS")) : null;
				result.conversion = node.find((child) => Array.isArray(child) && child[0] === "CONVERSION") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "CONVERSION")) : null;
				const csNode = node.find((child) => Array.isArray(child) && child[0] === "CS");
				if (csNode) result.coordinate_system = {
					subtype: csNode[1],
					axis: this.extractAxes(node)
				};
				const lengthUnitNode = node.find((child) => Array.isArray(child) && child[0] === "LENGTHUNIT");
				if (lengthUnitNode) {
					const unit = this.convertUnit(lengthUnitNode);
					result.coordinate_system.unit = unit;
				}
				result.id = this.getId(node);
				break;
			case "BASEGEOGCRS":
			case "GEOGCRS":
			case "GEODCRS":
				result.type = node[0] === "GEODCRS" ? "GeodeticCRS" : "GeographicCRS";
				result.name = node[1];
				const datumOrEnsembleNode = node.find((child) => Array.isArray(child) && (child[0] === "DATUM" || child[0] === "ENSEMBLE"));
				if (datumOrEnsembleNode) {
					const datumOrEnsemble = this.convert(datumOrEnsembleNode);
					if (datumOrEnsembleNode[0] === "ENSEMBLE") result.datum_ensemble = datumOrEnsemble;
					else result.datum = datumOrEnsemble;
					const primem = node.find((child) => Array.isArray(child) && child[0] === "PRIMEM");
					if (primem && primem[1] !== "Greenwich") datumOrEnsemble.prime_meridian = {
						name: primem[1],
						longitude: parseFloat(primem[2])
					};
				}
				const geogCsNode = node.find((child) => Array.isArray(child) && child[0] === "CS");
				result.coordinate_system = {
					subtype: geogCsNode ? geogCsNode[1] : "ellipsoidal",
					axis: this.extractAxes(node)
				};
				result.id = this.getId(node);
				break;
			case "DATUM":
				result.type = "GeodeticReferenceFrame";
				result.name = node[1];
				result.ellipsoid = node.find((child) => Array.isArray(child) && child[0] === "ELLIPSOID") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "ELLIPSOID")) : null;
				break;
			case "ENSEMBLE":
				result.type = "DatumEnsemble";
				result.name = node[1];
				result.members = node.filter((child) => Array.isArray(child) && child[0] === "MEMBER").map((member) => ({
					type: "DatumEnsembleMember",
					name: member[1],
					id: this.getId(member)
				}));
				const accuracyNode = node.find((child) => Array.isArray(child) && child[0] === "ENSEMBLEACCURACY");
				if (accuracyNode) result.accuracy = parseFloat(accuracyNode[1]);
				const ellipsoidNode = node.find((child) => Array.isArray(child) && child[0] === "ELLIPSOID");
				if (ellipsoidNode) result.ellipsoid = this.convert(ellipsoidNode);
				result.id = this.getId(node);
				break;
			case "ELLIPSOID":
				result.type = "Ellipsoid";
				result.name = node[1];
				result.semi_major_axis = parseFloat(node[2]);
				result.inverse_flattening = parseFloat(node[3]);
				node.find((child) => Array.isArray(child) && child[0] === "LENGTHUNIT") && this.convert(node.find((child) => Array.isArray(child) && child[0] === "LENGTHUNIT"), result);
				break;
			case "CONVERSION":
				result.type = "Conversion";
				result.name = node[1];
				result.method = node.find((child) => Array.isArray(child) && child[0] === "METHOD") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "METHOD")) : null;
				result.parameters = node.filter((child) => Array.isArray(child) && child[0] === "PARAMETER").map((param) => this.convert(param));
				break;
			case "METHOD":
				result.type = "Method";
				result.name = node[1];
				result.id = this.getId(node);
				break;
			case "PARAMETER":
				result.type = "Parameter";
				result.name = node[1];
				result.value = parseFloat(node[2]);
				result.unit = this.convertUnit(node.find((child) => Array.isArray(child) && (child[0] === "LENGTHUNIT" || child[0] === "ANGLEUNIT" || child[0] === "SCALEUNIT")));
				result.id = this.getId(node);
				break;
			case "BOUNDCRS":
				result.type = "BoundCRS";
				const sourceCrsNode = node.find((child) => Array.isArray(child) && child[0] === "SOURCECRS");
				if (sourceCrsNode) {
					const sourceCrsContent = sourceCrsNode.find((child) => Array.isArray(child));
					result.source_crs = sourceCrsContent ? this.convert(sourceCrsContent) : null;
				}
				const targetCrsNode = node.find((child) => Array.isArray(child) && child[0] === "TARGETCRS");
				if (targetCrsNode) {
					const targetCrsContent = targetCrsNode.find((child) => Array.isArray(child));
					result.target_crs = targetCrsContent ? this.convert(targetCrsContent) : null;
				}
				const transformationNode = node.find((child) => Array.isArray(child) && child[0] === "ABRIDGEDTRANSFORMATION");
				if (transformationNode) result.transformation = this.convert(transformationNode);
				else result.transformation = null;
				break;
			case "ABRIDGEDTRANSFORMATION":
				result.type = "Transformation";
				result.name = node[1];
				result.method = node.find((child) => Array.isArray(child) && child[0] === "METHOD") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "METHOD")) : null;
				result.parameters = node.filter((child) => Array.isArray(child) && (child[0] === "PARAMETER" || child[0] === "PARAMETERFILE")).map((param) => {
					if (param[0] === "PARAMETER") return this.convert(param);
					else if (param[0] === "PARAMETERFILE") return {
						name: param[1],
						value: param[2],
						id: {
							"authority": "EPSG",
							"code": 8656
						}
					};
				});
				if (result.parameters.length === 7) {
					const scaleDifference = result.parameters[6];
					if (scaleDifference.name === "Scale difference") scaleDifference.value = Math.round((scaleDifference.value - 1) * 0xe8d4a51000) / 1e6;
				}
				result.id = this.getId(node);
				break;
			case "AXIS":
				if (!result.coordinate_system) result.coordinate_system = {
					type: "unspecified",
					axis: []
				};
				result.coordinate_system.axis.push(this.convertAxis(node));
				break;
			case "LENGTHUNIT":
				const unit = this.convertUnit(node, "LinearUnit");
				if (result.coordinate_system && result.coordinate_system.axis) result.coordinate_system.axis.forEach((axis) => {
					if (!axis.unit) axis.unit = unit;
				});
				if (unit.conversion_factor && unit.conversion_factor !== 1) {
					if (result.semi_major_axis) result.semi_major_axis = {
						value: result.semi_major_axis,
						unit
					};
				}
				break;
			default:
				result.keyword = node[0];
				break;
		}
		return result;
	}
};
//#endregion
//#region node_modules/wkt-parser/buildPROJJSON.js
/**
* Builds a PROJJSON object from a WKT array structure.
* @param {Array} root The root WKT array node.
* @returns {Object} The PROJJSON object.
*/
function buildPROJJSON(root) {
	return PROJJSONBuilderBase.convert(root);
}
//#endregion
//#region node_modules/wkt-parser/detectWKTVersion.js
/**
* Detects whether the WKT string is WKT1 or WKT2.
* @param {string} wkt The WKT string.
* @returns {string} The detected version ("WKT1" or "WKT2").
*/
function detectWKTVersion(wkt) {
	const normalizedWKT = wkt.toUpperCase();
	if (normalizedWKT.includes("PROJCRS") || normalizedWKT.includes("GEOGCRS") || normalizedWKT.includes("BOUNDCRS") || normalizedWKT.includes("VERTCRS") || normalizedWKT.includes("LENGTHUNIT") || normalizedWKT.includes("ANGLEUNIT") || normalizedWKT.includes("SCALEUNIT")) return "WKT2";
	if (normalizedWKT.includes("PROJCS") || normalizedWKT.includes("GEOGCS") || normalizedWKT.includes("LOCAL_CS") || normalizedWKT.includes("VERT_CS") || normalizedWKT.includes("UNIT")) return "WKT1";
	return "WKT1";
}
//#endregion
//#region node_modules/wkt-parser/parser.js
var parser_default = parseString;
var NEUTRAL = 1;
var KEYWORD = 2;
var NUMBER = 3;
var QUOTED = 4;
var AFTERQUOTE = 5;
var ENDED = -1;
var whitespace = /\s/;
var latin = /[A-Za-z]/;
var keyword = /[A-Za-z84_]/;
var endThings = /[,\]]/;
var digets = /[\d\.E\-\+]/;
function Parser(text) {
	if (typeof text !== "string") throw new Error("not a string");
	this.text = text.trim();
	this.level = 0;
	this.place = 0;
	this.root = null;
	this.stack = [];
	this.currentObject = null;
	this.state = NEUTRAL;
}
Parser.prototype.readCharicter = function() {
	var char = this.text[this.place++];
	if (this.state !== QUOTED) while (whitespace.test(char)) {
		if (this.place >= this.text.length) return;
		char = this.text[this.place++];
	}
	switch (this.state) {
		case NEUTRAL: return this.neutral(char);
		case KEYWORD: return this.keyword(char);
		case QUOTED: return this.quoted(char);
		case AFTERQUOTE: return this.afterquote(char);
		case NUMBER: return this.number(char);
		case ENDED: return;
	}
};
Parser.prototype.afterquote = function(char) {
	if (char === "\"") {
		this.word += "\"";
		this.state = QUOTED;
		return;
	}
	if (endThings.test(char)) {
		this.word = this.word.trim();
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in afterquote yet, index " + this.place);
};
Parser.prototype.afterItem = function(char) {
	if (char === ",") {
		if (this.word !== null) this.currentObject.push(this.word);
		this.word = null;
		this.state = NEUTRAL;
		return;
	}
	if (char === "]") {
		this.level--;
		if (this.word !== null) {
			this.currentObject.push(this.word);
			this.word = null;
		}
		this.state = NEUTRAL;
		this.currentObject = this.stack.pop();
		if (!this.currentObject) this.state = ENDED;
		return;
	}
};
Parser.prototype.number = function(char) {
	if (digets.test(char)) {
		this.word += char;
		return;
	}
	if (endThings.test(char)) {
		this.word = parseFloat(this.word);
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in number yet, index " + this.place);
};
Parser.prototype.quoted = function(char) {
	if (char === "\"") {
		this.state = AFTERQUOTE;
		return;
	}
	this.word += char;
};
Parser.prototype.keyword = function(char) {
	if (keyword.test(char)) {
		this.word += char;
		return;
	}
	if (char === "[") {
		var newObjects = [];
		newObjects.push(this.word);
		this.level++;
		if (this.root === null) this.root = newObjects;
		else this.currentObject.push(newObjects);
		this.stack.push(this.currentObject);
		this.currentObject = newObjects;
		this.state = NEUTRAL;
		return;
	}
	if (endThings.test(char)) {
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in keyword yet, index " + this.place);
};
Parser.prototype.neutral = function(char) {
	if (latin.test(char)) {
		this.word = char;
		this.state = KEYWORD;
		return;
	}
	if (char === "\"") {
		this.word = "";
		this.state = QUOTED;
		return;
	}
	if (digets.test(char)) {
		this.word = char;
		this.state = NUMBER;
		return;
	}
	if (endThings.test(char)) {
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in neutral yet, index " + this.place);
};
Parser.prototype.output = function() {
	while (this.place < this.text.length) this.readCharicter();
	if (this.state === ENDED) return this.root;
	throw new Error("unable to parse string \"" + this.text + "\". State is " + this.state);
};
function parseString(txt) {
	return new Parser(txt).output();
}
//#endregion
//#region node_modules/wkt-parser/process.js
function mapit(obj, key, value) {
	if (Array.isArray(key)) {
		value.unshift(key);
		key = null;
	}
	var thing = key ? {} : obj;
	var out = value.reduce(function(newObj, item) {
		sExpr(item, newObj);
		return newObj;
	}, thing);
	if (key) obj[key] = out;
}
function sExpr(v, obj) {
	if (!Array.isArray(v)) {
		obj[v] = true;
		return;
	}
	var key = v.shift();
	if (key === "PARAMETER") key = v.shift();
	if (v.length === 1) {
		if (Array.isArray(v[0])) {
			obj[key] = {};
			sExpr(v[0], obj[key]);
			return;
		}
		obj[key] = v[0];
		return;
	}
	if (!v.length) {
		obj[key] = true;
		return;
	}
	if (key === "TOWGS84") {
		obj[key] = v;
		return;
	}
	if (key === "AXIS") {
		if (!(key in obj)) obj[key] = [];
		obj[key].push(v);
		return;
	}
	if (!Array.isArray(key)) obj[key] = {};
	var i;
	switch (key) {
		case "UNIT":
		case "PRIMEM":
		case "VERT_DATUM":
			obj[key] = {
				name: v[0].toLowerCase(),
				convert: v[1]
			};
			if (v.length === 3) sExpr(v[2], obj[key]);
			return;
		case "SPHEROID":
		case "ELLIPSOID":
			obj[key] = {
				name: v[0],
				a: v[1],
				rf: v[2]
			};
			if (v.length === 4) sExpr(v[3], obj[key]);
			return;
		case "EDATUM":
		case "ENGINEERINGDATUM":
		case "LOCAL_DATUM":
		case "DATUM":
		case "VERT_CS":
		case "VERTCRS":
		case "VERTICALCRS":
			v[0] = ["name", v[0]];
			mapit(obj, key, v);
			return;
		case "COMPD_CS":
		case "COMPOUNDCRS":
		case "FITTED_CS":
		case "PROJECTEDCRS":
		case "PROJCRS":
		case "GEOGCS":
		case "GEOCCS":
		case "PROJCS":
		case "LOCAL_CS":
		case "GEODCRS":
		case "GEODETICCRS":
		case "GEODETICDATUM":
		case "ENGCRS":
		case "ENGINEERINGCRS":
			v[0] = ["name", v[0]];
			mapit(obj, key, v);
			obj[key].type = key;
			return;
		default:
			i = -1;
			while (++i < v.length) if (!Array.isArray(v[i])) return sExpr(v, obj[key]);
			return mapit(obj, key, v);
	}
}
//#endregion
//#region node_modules/wkt-parser/util.js
var D2R = .017453292519943295;
function d2r(input) {
	return input * D2R;
}
function applyProjectionDefaults(wkt) {
	const normalizedProjName = (wkt.projName || "").toLowerCase().replace(/_/g, " ");
	if (wkt.long0 === void 0 && wkt.longc !== void 0) wkt.long0 = wkt.longc;
	if (!wkt.lat_ts && wkt.lat1 && (normalizedProjName === "stereographic south pole" || normalizedProjName === "polar stereographic (variant b)")) {
		wkt.lat0 = d2r(wkt.lat1 > 0 ? 90 : -90);
		wkt.lat_ts = wkt.lat1;
		delete wkt.lat1;
	} else if (!wkt.lat_ts && wkt.lat0 && (normalizedProjName === "polar stereographic" || normalizedProjName === "polar stereographic (variant a)")) {
		wkt.lat_ts = wkt.lat0;
		wkt.lat0 = d2r(wkt.lat0 > 0 ? 90 : -90);
		delete wkt.lat1;
	}
}
//#endregion
//#region node_modules/wkt-parser/transformPROJJSON.js
function processUnit(unit) {
	let result = {
		units: null,
		to_meter: void 0
	};
	if (typeof unit === "string") {
		result.units = unit.toLowerCase();
		if (result.units === "metre") result.units = "meter";
		if (result.units === "meter") result.to_meter = 1;
	} else if (unit && unit.name) {
		result.units = unit.name.toLowerCase();
		if (result.units === "metre") result.units = "meter";
		result.to_meter = unit.conversion_factor;
	}
	return result;
}
function toValue(valueOrObject) {
	if (typeof valueOrObject === "object") return valueOrObject.value * valueOrObject.unit.conversion_factor;
	return valueOrObject;
}
function calculateEllipsoid(value, result) {
	if (value.ellipsoid.radius) {
		result.a = value.ellipsoid.radius;
		result.rf = 0;
	} else {
		result.a = toValue(value.ellipsoid.semi_major_axis);
		if (value.ellipsoid.inverse_flattening !== void 0) result.rf = value.ellipsoid.inverse_flattening;
		else if (value.ellipsoid.semi_major_axis !== void 0 && value.ellipsoid.semi_minor_axis !== void 0) result.rf = result.a / (result.a - toValue(value.ellipsoid.semi_minor_axis));
	}
}
function transformPROJJSON(projjson, result = {}) {
	if (!projjson || typeof projjson !== "object") return projjson;
	if (projjson.type === "BoundCRS") {
		transformPROJJSON(projjson.source_crs, result);
		if (projjson.transformation) if (projjson.transformation.method && projjson.transformation.method.name === "NTv2") result.nadgrids = projjson.transformation.parameters[0].value;
		else result.datum_params = projjson.transformation.parameters.map((param) => param.value);
		return result;
	}
	Object.keys(projjson).forEach((key) => {
		const value = projjson[key];
		if (value === null) return;
		switch (key) {
			case "name":
				if (result.srsCode) break;
				result.name = value;
				result.srsCode = value;
				break;
			case "type":
				if (value === "GeographicCRS") result.projName = "longlat";
				else if (value === "GeodeticCRS") if (projjson.coordinate_system && projjson.coordinate_system.subtype === "Cartesian") result.projName = "geocent";
				else result.projName = "longlat";
				else if (value === "ProjectedCRS" && projjson.conversion && projjson.conversion.method) result.projName = projjson.conversion.method.name;
				break;
			case "datum":
			case "datum_ensemble":
				if (value.ellipsoid) {
					result.ellps = value.ellipsoid.name;
					calculateEllipsoid(value, result);
				}
				if (value.prime_meridian) result.from_greenwich = value.prime_meridian.longitude * Math.PI / 180;
				break;
			case "ellipsoid":
				result.ellps = value.name;
				calculateEllipsoid(value, result);
				break;
			case "prime_meridian":
				result.long0 = (value.longitude || 0) * Math.PI / 180;
				break;
			case "coordinate_system":
				if (value.axis) {
					const directionMap = {
						"east": "e",
						"north": "n",
						"west": "w",
						"south": "s",
						"up": "u",
						"down": "d",
						"geocentricx": "e",
						"geocentricy": "n",
						"geocentricz": "u"
					};
					const mapped = value.axis.map((axis) => directionMap[axis.direction.toLowerCase()]);
					if (mapped.every(Boolean)) {
						result.axis = mapped.join("");
						if (result.axis.length === 2) result.axis += "u";
					}
					if (value.unit) {
						const { units, to_meter } = processUnit(value.unit);
						result.units = units;
						result.to_meter = to_meter;
					} else if (value.axis[0] && value.axis[0].unit) {
						const { units, to_meter } = processUnit(value.axis[0].unit);
						result.units = units;
						result.to_meter = to_meter;
					}
				}
				break;
			case "id":
				if (value.authority && value.code) result.title = value.authority + ":" + value.code;
				break;
			case "conversion":
				if (value.method && value.method.name) result.projName = value.method.name;
				if (value.parameters) value.parameters.forEach((param) => {
					const paramName = param.name.toLowerCase().replace(/\s+/g, "_");
					const paramValue = param.value;
					if (param.unit && param.unit.conversion_factor) result[paramName] = paramValue * param.unit.conversion_factor;
					else if (param.unit === "degree") result[paramName] = paramValue * Math.PI / 180;
					else result[paramName] = paramValue;
				});
				break;
			case "unit":
				if (value.name) {
					result.units = value.name.toLowerCase();
					if (result.units === "metre") result.units = "meter";
				}
				if (value.conversion_factor) result.to_meter = value.conversion_factor;
				break;
			case "base_crs":
				transformPROJJSON(value, result);
				result.datumCode = value.id ? value.id.authority + "_" + value.id.code : value.name;
				break;
			default: break;
		}
	});
	if (result.latitude_of_false_origin !== void 0) result.lat0 = result.latitude_of_false_origin;
	if (result.longitude_of_false_origin !== void 0) result.long0 = result.longitude_of_false_origin;
	if (result.latitude_of_standard_parallel !== void 0) {
		result.lat0 = result.latitude_of_standard_parallel;
		result.lat1 = result.latitude_of_standard_parallel;
	}
	if (result.latitude_of_1st_standard_parallel !== void 0) result.lat1 = result.latitude_of_1st_standard_parallel;
	if (result.latitude_of_2nd_standard_parallel !== void 0) result.lat2 = result.latitude_of_2nd_standard_parallel;
	if (result.latitude_of_projection_centre !== void 0) result.lat0 = result.latitude_of_projection_centre;
	if (result.longitude_of_projection_centre !== void 0) result.longc = result.longitude_of_projection_centre;
	if (result.easting_at_false_origin !== void 0) result.x0 = result.easting_at_false_origin;
	if (result.northing_at_false_origin !== void 0) result.y0 = result.northing_at_false_origin;
	if (result.latitude_of_natural_origin !== void 0) result.lat0 = result.latitude_of_natural_origin;
	if (result.longitude_of_natural_origin !== void 0) result.long0 = result.longitude_of_natural_origin;
	if (result.longitude_of_origin !== void 0) result.long0 = result.longitude_of_origin;
	if (result.false_easting !== void 0) result.x0 = result.false_easting;
	if (result.easting_at_projection_centre) result.x0 = result.easting_at_projection_centre;
	if (result.false_northing !== void 0) result.y0 = result.false_northing;
	if (result.northing_at_projection_centre) result.y0 = result.northing_at_projection_centre;
	if (result.standard_parallel_1 !== void 0) result.lat1 = result.standard_parallel_1;
	if (result.standard_parallel_2 !== void 0) result.lat2 = result.standard_parallel_2;
	if (result.scale_factor_at_natural_origin !== void 0) result.k0 = result.scale_factor_at_natural_origin;
	if (result.scale_factor_at_projection_centre !== void 0) result.k0 = result.scale_factor_at_projection_centre;
	if (result.scale_factor_on_pseudo_standard_parallel !== void 0) result.k0 = result.scale_factor_on_pseudo_standard_parallel;
	if (result.azimuth !== void 0) result.alpha = result.azimuth;
	if (result.azimuth_at_projection_centre !== void 0) result.alpha = result.azimuth_at_projection_centre;
	if (result.angle_from_rectified_to_skew_grid) result.rectified_grid_angle = result.angle_from_rectified_to_skew_grid;
	applyProjectionDefaults(result);
	return result;
}
//#endregion
//#region node_modules/wkt-parser/index.js
var knownTypes = [
	"PROJECTEDCRS",
	"PROJCRS",
	"GEOGCS",
	"GEOCCS",
	"PROJCS",
	"LOCAL_CS",
	"GEODCRS",
	"GEODETICCRS",
	"GEODETICDATUM",
	"ENGCRS",
	"ENGINEERINGCRS"
];
function rename(obj, params) {
	var outName = params[0];
	var inName = params[1];
	if (!(outName in obj) && inName in obj) {
		obj[outName] = obj[inName];
		if (params.length === 3) obj[outName] = params[2](obj[outName]);
	}
}
function cleanWKT(wkt) {
	var keys = Object.keys(wkt);
	for (var i = 0, ii = keys.length; i < ii; ++i) {
		var key = keys[i];
		if (knownTypes.indexOf(key) !== -1) setPropertiesFromWkt(wkt[key]);
		if (typeof wkt[key] === "object") cleanWKT(wkt[key]);
	}
}
function setPropertiesFromWkt(wkt) {
	if (wkt.AUTHORITY) {
		var authority = Object.keys(wkt.AUTHORITY)[0];
		if (authority && authority in wkt.AUTHORITY) wkt.title = authority + ":" + wkt.AUTHORITY[authority];
	}
	if (wkt.type === "GEOGCS") wkt.projName = "longlat";
	else if (wkt.type === "LOCAL_CS") {
		wkt.projName = "identity";
		wkt.local = true;
	} else if (typeof wkt.PROJECTION === "object") wkt.projName = Object.keys(wkt.PROJECTION)[0];
	else wkt.projName = wkt.PROJECTION;
	if (wkt.AXIS) {
		var axisOrder = "";
		for (var i = 0, ii = wkt.AXIS.length; i < ii; ++i) {
			var axis = [wkt.AXIS[i][0].toLowerCase(), wkt.AXIS[i][1].toLowerCase()];
			if (axis[0].indexOf("north") !== -1 || (axis[0] === "y" || axis[0] === "lat") && axis[1] === "north") axisOrder += "n";
			else if (axis[0].indexOf("south") !== -1 || (axis[0] === "y" || axis[0] === "lat") && axis[1] === "south") axisOrder += "s";
			else if (axis[0].indexOf("east") !== -1 || (axis[0] === "x" || axis[0] === "lon") && axis[1] === "east") axisOrder += "e";
			else if (axis[0].indexOf("west") !== -1 || (axis[0] === "x" || axis[0] === "lon") && axis[1] === "west") axisOrder += "w";
		}
		if (axisOrder.length === 2) axisOrder += "u";
		if (axisOrder.length === 3) wkt.axis = axisOrder;
	}
	if (wkt.UNIT) {
		wkt.units = wkt.UNIT.name.toLowerCase();
		if (wkt.units === "metre") wkt.units = "meter";
		if (wkt.UNIT.convert) if (wkt.type === "GEOGCS") {
			if (wkt.DATUM && wkt.DATUM.SPHEROID) wkt.to_meter = wkt.UNIT.convert * wkt.DATUM.SPHEROID.a;
		} else wkt.to_meter = wkt.UNIT.convert;
	}
	var geogcs = wkt.GEOGCS;
	if (wkt.type === "GEOGCS") geogcs = wkt;
	if (geogcs) {
		if (geogcs.PRIMEM && geogcs.PRIMEM.convert) wkt.from_greenwich = d2r(geogcs.PRIMEM.convert);
		if (geogcs.DATUM) wkt.datumCode = geogcs.DATUM.name.toLowerCase();
		else wkt.datumCode = geogcs.name.toLowerCase();
		if (wkt.datumCode.slice(0, 2) === "d_") wkt.datumCode = wkt.datumCode.slice(2);
		if (wkt.datumCode === "new_zealand_1949") wkt.datumCode = "nzgd49";
		if (wkt.datumCode === "wgs_1984" || wkt.datumCode === "world_geodetic_system_1984") {
			if (wkt.PROJECTION === "Mercator_Auxiliary_Sphere") wkt.sphere = true;
			wkt.datumCode = "wgs84";
		}
		if (wkt.datumCode === "belge_1972") wkt.datumCode = "rnb72";
		if (geogcs.DATUM && geogcs.DATUM.SPHEROID) {
			wkt.ellps = geogcs.DATUM.SPHEROID.name.replace("_19", "").replace(/[Cc]larke\_18/, "clrk");
			if (wkt.ellps.toLowerCase().slice(0, 13) === "international") wkt.ellps = "intl";
			wkt.a = geogcs.DATUM.SPHEROID.a;
			wkt.rf = parseFloat(geogcs.DATUM.SPHEROID.rf);
		}
		if (geogcs.DATUM && geogcs.DATUM.TOWGS84) wkt.datum_params = geogcs.DATUM.TOWGS84;
		if (~wkt.datumCode.indexOf("osgb_1936")) wkt.datumCode = "osgb36";
		if (~wkt.datumCode.indexOf("osni_1952")) wkt.datumCode = "osni52";
		if (~wkt.datumCode.indexOf("tm65") || ~wkt.datumCode.indexOf("geodetic_datum_of_1965")) wkt.datumCode = "ire65";
		if (wkt.datumCode === "ch1903+") wkt.datumCode = "ch1903";
		if (~wkt.datumCode.indexOf("israel")) wkt.datumCode = "isr93";
	}
	if (wkt.b && !isFinite(wkt.b)) wkt.b = wkt.a;
	if (wkt.rectified_grid_angle) wkt.rectified_grid_angle = d2r(wkt.rectified_grid_angle);
	function toMeter(input) {
		return input * (wkt.to_meter || 1);
	}
	var renamer = function(a) {
		return rename(wkt, a);
	};
	[
		["standard_parallel_1", "Standard_Parallel_1"],
		["standard_parallel_1", "Latitude of 1st standard parallel"],
		["standard_parallel_2", "Standard_Parallel_2"],
		["standard_parallel_2", "Latitude of 2nd standard parallel"],
		["false_easting", "False_Easting"],
		["false_easting", "False easting"],
		["false-easting", "Easting at false origin"],
		["false_northing", "False_Northing"],
		["false_northing", "False northing"],
		["false_northing", "Northing at false origin"],
		["central_meridian", "Central_Meridian"],
		["central_meridian", "Longitude of natural origin"],
		["central_meridian", "Longitude of false origin"],
		["latitude_of_origin", "Latitude_Of_Origin"],
		["latitude_of_origin", "Central_Parallel"],
		["latitude_of_origin", "Latitude of natural origin"],
		["latitude_of_origin", "Latitude of false origin"],
		["scale_factor", "Scale_Factor"],
		["k0", "scale_factor"],
		["latitude_of_center", "Latitude_Of_Center"],
		["latitude_of_center", "Latitude_of_center"],
		[
			"lat0",
			"latitude_of_center",
			d2r
		],
		["longitude_of_center", "Longitude_Of_Center"],
		["longitude_of_center", "Longitude_of_center"],
		[
			"longc",
			"longitude_of_center",
			d2r
		],
		[
			"x0",
			"false_easting",
			toMeter
		],
		[
			"y0",
			"false_northing",
			toMeter
		],
		[
			"long0",
			"central_meridian",
			d2r
		],
		[
			"lat0",
			"latitude_of_origin",
			d2r
		],
		[
			"lat0",
			"standard_parallel_1",
			d2r
		],
		[
			"lat1",
			"standard_parallel_1",
			d2r
		],
		[
			"lat2",
			"standard_parallel_2",
			d2r
		],
		["azimuth", "Azimuth"],
		[
			"alpha",
			"azimuth",
			d2r
		],
		["srsCode", "name"]
	].forEach(renamer);
	applyProjectionDefaults(wkt);
}
function wkt_parser_default(wkt) {
	if (typeof wkt === "object") return transformPROJJSON(wkt);
	const version = detectWKTVersion(wkt);
	var lisp = parser_default(wkt);
	if (version === "WKT2") return transformPROJJSON(buildPROJJSON(lisp));
	var type = lisp[0];
	var obj = {};
	sExpr(lisp, obj);
	cleanWKT(obj);
	return obj[type];
}
//#endregion
//#region node_modules/proj4/lib/defs.js
/**
* @typedef {Object} ProjectionDefinition
* @property {string} title
* @property {string} [projName]
* @property {string} [ellps]
* @property {import('./Proj.js').DatumDefinition} [datum]
* @property {string} [datumName]
* @property {number} [rf]
* @property {number} [lat0]
* @property {number} [lat1]
* @property {number} [lat2]
* @property {number} [lat_ts]
* @property {number} [long0]
* @property {number} [long1]
* @property {number} [long2]
* @property {number} [long_wrap]
* @property {number} [alpha]
* @property {number} [longc]
* @property {number} [x0]
* @property {number} [y0]
* @property {number} [k0]
* @property {number} [a]
* @property {number} [b]
* @property {true} [R_A]
* @property {number} [zone]
* @property {true} [utmSouth]
* @property {string|Array<number>} [datum_params]
* @property {number} [to_meter]
* @property {string} [units]
* @property {number} [from_greenwich]
* @property {string} [datumCode]
* @property {string} [nadgrids]
* @property {string} [axis]
* @property {boolean} [sphere]
* @property {number} [rectified_grid_angle]
* @property {boolean} [approx]
* @property {boolean} [over]
* @property {string} [projStr]
* @property {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} inverse
* @property {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} forward
*/
/**
* @overload
* @param {string} name
* @param {string|ProjectionDefinition|import('./core.js').PROJJSONDefinition} projection
* @returns {void}
*/
/**
* @overload
* @param {Array<[string, string]>} name
* @returns {Array<ProjectionDefinition|undefined>}
*/
/**
* @overload
* @param {string} name
* @returns {ProjectionDefinition}
*/
/**
* @param {string | Array<Array<string>> | Partial<Record<'EPSG'|'ESRI'|'IAU2000', ProjectionDefinition>>} name
* @returns {ProjectionDefinition | Array<ProjectionDefinition|undefined> | void}
*/
function defs(name) {
	var that = this;
	if (arguments.length === 2) {
		var def = arguments[1];
		if (typeof def === "string") if (def.charAt(0) === "+") defs[name] = projString_default(arguments[1]);
		else defs[name] = wkt_parser_default(arguments[1]);
		else if (def && typeof def === "object" && !("projName" in def)) defs[name] = wkt_parser_default(arguments[1]);
		else {
			defs[name] = def;
			if (!def) delete defs[name];
		}
	} else if (arguments.length === 1) {
		if (Array.isArray(name)) return name.map(function(v) {
			if (Array.isArray(v)) return defs.apply(that, v);
			else return defs(v);
		});
		else if (typeof name === "string") {
			if (name in defs) return defs[name];
		} else if ("EPSG" in name) defs["EPSG:" + name.EPSG] = name;
		else if ("ESRI" in name) defs["ESRI:" + name.ESRI] = name;
		else if ("IAU2000" in name) defs["IAU2000:" + name.IAU2000] = name;
		else console.log(name);
		return;
	}
}
global_default(defs);
//#endregion
//#region node_modules/proj4/lib/parseCode.js
function testObj(code) {
	return typeof code === "string";
}
function testDef(code) {
	return code in defs;
}
function testWKT(code) {
	return code.indexOf("+") !== 0 && code.indexOf("[") !== -1 || typeof code === "object" && !("srsCode" in code);
}
var codes = [
	"3857",
	"900913",
	"3785",
	"102113"
];
function checkMercator(item) {
	if (item.title) return item.title.toLowerCase().indexOf("epsg:") === 0 && codes.indexOf(item.title.substr(5)) > -1;
	var auth = match(item, "authority");
	if (!auth) return;
	var code = match(auth, "epsg");
	return code && codes.indexOf(code) > -1;
}
function checkProjStr(item) {
	var ext = match(item, "extension");
	if (!ext) return;
	return match(ext, "proj4");
}
function testProj(code) {
	return code[0] === "+";
}
/**
* @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} code
* @returns {import('./defs').ProjectionDefinition}
*/
function parse$1(code) {
	let out;
	if (testObj(code)) {
		if (testDef(code)) out = defs[code];
		else if (testWKT(code)) {
			out = wkt_parser_default(code);
			var maybeProjStr = checkProjStr(out);
			if (maybeProjStr) out = projString_default(maybeProjStr);
		} else if (testProj(code)) out = projString_default(code);
	} else if (!("projName" in code)) out = wkt_parser_default(code);
	else out = code;
	return out && checkMercator(out) ? defs["EPSG:3857"] : out;
}
//#endregion
//#region node_modules/proj4/lib/extend.js
function extend_default(destination, source) {
	destination = destination || {};
	var value, property;
	if (!source) return destination;
	for (property in source) {
		value = source[property];
		if (value !== void 0) destination[property] = value;
	}
	return destination;
}
//#endregion
//#region node_modules/proj4/lib/common/msfnz.js
function msfnz_default(eccent, sinphi, cosphi) {
	var con = eccent * sinphi;
	return cosphi / Math.sqrt(1 - con * con);
}
//#endregion
//#region node_modules/proj4/lib/common/sign.js
function sign_default(x) {
	return x < 0 ? -1 : 1;
}
//#endregion
//#region node_modules/proj4/lib/common/adjust_lon.js
function adjust_lon_default(x, skipAdjust) {
	if (skipAdjust) return x;
	return Math.abs(x) <= 3.14159265359 ? x : x - sign_default(x) * TWO_PI;
}
//#endregion
//#region node_modules/proj4/lib/common/tsfnz.js
function tsfnz_default(eccent, phi, sinphi) {
	var con = eccent * sinphi;
	var com = .5 * eccent;
	con = Math.pow((1 - con) / (1 + con), com);
	return Math.tan(.5 * (HALF_PI - phi)) / con;
}
//#endregion
//#region node_modules/proj4/lib/common/phi2z.js
function phi2z_default(eccent, ts) {
	var eccnth = .5 * eccent;
	var con, dphi;
	var phi = HALF_PI - 2 * Math.atan(ts);
	for (var i = 0; i <= 15; i++) {
		con = eccent * Math.sin(phi);
		dphi = HALF_PI - 2 * Math.atan(ts * Math.pow((1 - con) / (1 + con), eccnth)) - phi;
		phi += dphi;
		if (Math.abs(dphi) <= 1e-10) return phi;
	}
	return -9999;
}
//#endregion
//#region node_modules/proj4/lib/projections/merc.js
/**
* @typedef {Object} LocalThis
* @property {number} es
* @property {number} e
* @property {number} k
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$35() {
	var con = this.b / this.a;
	this.es = 1 - con * con;
	if (!("x0" in this)) this.x0 = 0;
	if (!("y0" in this)) this.y0 = 0;
	this.long0 = this.long0 || 0;
	this.e = Math.sqrt(this.es);
	if (this.lat_ts) if (this.sphere) this.k0 = Math.cos(this.lat_ts);
	else this.k0 = msfnz_default(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts));
	else if (!this.k0) if (this.k) this.k0 = this.k;
	else this.k0 = 1;
}
function forward$33(p) {
	var lon = p.x;
	var lat = p.y;
	if (lat * 57.29577951308232 > 90 && lat * 57.29577951308232 < -90 && lon * 57.29577951308232 > 180 && lon * 57.29577951308232 < -180) return null;
	var x, y;
	if (Math.abs(Math.abs(lat) - HALF_PI) <= 1e-10) return null;
	else {
		if (this.sphere) {
			x = this.x0 + this.a * this.k0 * adjust_lon_default(lon - this.long0, this.over);
			y = this.y0 + this.a * this.k0 * Math.log(Math.tan(FORTPI + .5 * lat));
		} else {
			var sinphi = Math.sin(lat);
			var ts = tsfnz_default(this.e, lat, sinphi);
			x = this.x0 + this.a * this.k0 * adjust_lon_default(lon - this.long0, this.over);
			y = this.y0 - this.a * this.k0 * Math.log(ts);
		}
		p.x = x;
		p.y = y;
		return p;
	}
}
function inverse$33(p) {
	var x = p.x - this.x0;
	var y = p.y - this.y0;
	var lon, lat;
	if (this.sphere) lat = HALF_PI - 2 * Math.atan(Math.exp(-y / (this.a * this.k0)));
	else {
		var ts = Math.exp(-y / (this.a * this.k0));
		lat = phi2z_default(this.e, ts);
		if (lat === -9999) return null;
	}
	lon = adjust_lon_default(this.long0 + x / (this.a * this.k0), this.over);
	p.x = lon;
	p.y = lat;
	return p;
}
var merc_default = {
	init: init$35,
	forward: forward$33,
	inverse: inverse$33,
	names: [
		"Mercator",
		"Popular Visualisation Pseudo Mercator",
		"Mercator_1SP",
		"Mercator_Auxiliary_Sphere",
		"Mercator_Variant_A",
		"merc"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/longlat.js
function init$34() {}
function identity(pt) {
	return pt;
}
var names$35 = [
	"longlat",
	"identity",
	"lonlat",
	"latlon",
	"latlong"
];
//#endregion
//#region node_modules/proj4/lib/projections.js
/** @type {Array<Partial<import('./Proj').default>>} */
var projs = [merc_default, {
	init: init$34,
	forward: identity,
	inverse: identity,
	names: names$35
}];
var names$34 = {};
var projStore = [];
/**
* @param {import('./Proj').default} proj
* @param {number} i
*/
function add(proj, i) {
	var len = projStore.length;
	if (!proj.names) {
		console.log(i);
		return true;
	}
	projStore[len] = proj;
	proj.names.forEach(function(n) {
		names$34[n.toLowerCase()] = len;
	});
	return this;
}
function getNormalizedProjName(n) {
	return n.replace(/[-\(\)\s]+/g, " ").trim().replace(/ /g, "_");
}
/**
* Get a projection by name.
* @param {string} name
* @returns {import('./Proj').default|false}
*/
function get(name) {
	if (!name) return false;
	var n = name.toLowerCase();
	if (typeof names$34[n] !== "undefined" && projStore[names$34[n]]) return projStore[names$34[n]];
	n = getNormalizedProjName(n);
	if (n in names$34 && projStore[names$34[n]]) return projStore[names$34[n]];
}
function start() {
	projs.forEach(add);
}
var projections_default = {
	start,
	add,
	get
};
//#endregion
//#region node_modules/proj4/lib/constants/Ellipsoid.js
var ellipsoids = {
	MERIT: {
		a: 6378137,
		rf: 298.257,
		ellipseName: "MERIT 1983"
	},
	SGS85: {
		a: 6378136,
		rf: 298.257,
		ellipseName: "Soviet Geodetic System 85"
	},
	GRS80: {
		a: 6378137,
		rf: 298.257222101,
		ellipseName: "GRS 1980(IUGG, 1980)"
	},
	IAU76: {
		a: 6378140,
		rf: 298.257,
		ellipseName: "IAU 1976"
	},
	airy: {
		a: 6377563.396,
		b: 6356256.91,
		ellipseName: "Airy 1830"
	},
	APL4: {
		a: 6378137,
		rf: 298.25,
		ellipseName: "Appl. Physics. 1965"
	},
	NWL9D: {
		a: 6378145,
		rf: 298.25,
		ellipseName: "Naval Weapons Lab., 1965"
	},
	mod_airy: {
		a: 6377340.189,
		b: 6356034.446,
		ellipseName: "Modified Airy"
	},
	andrae: {
		a: 6377104.43,
		rf: 300,
		ellipseName: "Andrae 1876 (Den., Iclnd.)"
	},
	aust_SA: {
		a: 6378160,
		rf: 298.25,
		ellipseName: "Australian Natl & S. Amer. 1969"
	},
	GRS67: {
		a: 6378160,
		rf: 298.247167427,
		ellipseName: "GRS 67(IUGG 1967)"
	},
	bessel: {
		a: 6377397.155,
		rf: 299.1528128,
		ellipseName: "Bessel 1841"
	},
	bess_nam: {
		a: 6377483.865,
		rf: 299.1528128,
		ellipseName: "Bessel 1841 (Namibia)"
	},
	clrk66: {
		a: 6378206.4,
		b: 6356583.8,
		ellipseName: "Clarke 1866"
	},
	clrk80: {
		a: 6378249.145,
		rf: 293.4663,
		ellipseName: "Clarke 1880 mod."
	},
	clrk80ign: {
		a: 6378249.2,
		b: 6356515,
		rf: 293.4660213,
		ellipseName: "Clarke 1880 (IGN)"
	},
	clrk58: {
		a: 6378293.645208759,
		rf: 294.2606763692654,
		ellipseName: "Clarke 1858"
	},
	CPM: {
		a: 6375738.7,
		rf: 334.29,
		ellipseName: "Comm. des Poids et Mesures 1799"
	},
	delmbr: {
		a: 6376428,
		rf: 311.5,
		ellipseName: "Delambre 1810 (Belgium)"
	},
	engelis: {
		a: 6378136.05,
		rf: 298.2566,
		ellipseName: "Engelis 1985"
	},
	evrst30: {
		a: 6377276.345,
		rf: 300.8017,
		ellipseName: "Everest 1830"
	},
	evrst48: {
		a: 6377304.063,
		rf: 300.8017,
		ellipseName: "Everest 1948"
	},
	evrst56: {
		a: 6377301.243,
		rf: 300.8017,
		ellipseName: "Everest 1956"
	},
	evrst69: {
		a: 6377295.664,
		rf: 300.8017,
		ellipseName: "Everest 1969"
	},
	evrstSS: {
		a: 6377298.556,
		rf: 300.8017,
		ellipseName: "Everest (Sabah & Sarawak)"
	},
	fschr60: {
		a: 6378166,
		rf: 298.3,
		ellipseName: "Fischer (Mercury Datum) 1960"
	},
	fschr60m: {
		a: 6378155,
		rf: 298.3,
		ellipseName: "Fischer 1960"
	},
	fschr68: {
		a: 6378150,
		rf: 298.3,
		ellipseName: "Fischer 1968"
	},
	helmert: {
		a: 6378200,
		rf: 298.3,
		ellipseName: "Helmert 1906"
	},
	hough: {
		a: 6378270,
		rf: 297,
		ellipseName: "Hough"
	},
	intl: {
		a: 6378388,
		rf: 297,
		ellipseName: "International 1909 (Hayford)"
	},
	kaula: {
		a: 6378163,
		rf: 298.24,
		ellipseName: "Kaula 1961"
	},
	lerch: {
		a: 6378139,
		rf: 298.257,
		ellipseName: "Lerch 1979"
	},
	mprts: {
		a: 6397300,
		rf: 191,
		ellipseName: "Maupertius 1738"
	},
	new_intl: {
		a: 6378157.5,
		b: 6356772.2,
		ellipseName: "New International 1967"
	},
	plessis: {
		a: 6376523,
		b: 6355863,
		ellipseName: "Plessis 1817 (France)"
	},
	krass: {
		a: 6378245,
		rf: 298.3,
		ellipseName: "Krassovsky, 1942"
	},
	SEasia: {
		a: 6378155,
		b: 6356773.3205,
		ellipseName: "Southeast Asia"
	},
	walbeck: {
		a: 6376896,
		b: 6355834.8467,
		ellipseName: "Walbeck"
	},
	WGS60: {
		a: 6378165,
		rf: 298.3,
		ellipseName: "WGS 60"
	},
	WGS66: {
		a: 6378145,
		rf: 298.25,
		ellipseName: "WGS 66"
	},
	WGS7: {
		a: 6378135,
		rf: 298.26,
		ellipseName: "WGS 72"
	},
	WGS84: {
		a: 6378137,
		rf: 298.257223563,
		ellipseName: "WGS 84"
	},
	sphere: {
		a: 6370997,
		b: 6370997,
		ellipseName: "Normal Sphere (r=6370997)"
	}
};
//#endregion
//#region node_modules/proj4/lib/deriveConstants.js
var WGS84 = ellipsoids.WGS84;
function eccentricity(a, b, rf, R_A) {
	var a2 = a * a;
	var b2 = b * b;
	var es = (a2 - b2) / a2;
	var e = 0;
	if (R_A) {
		a *= 1 - es * (SIXTH + es * (RA4 + es * RA6));
		a2 = a * a;
		es = 0;
	} else e = Math.sqrt(es);
	var ep2 = (a2 - b2) / b2;
	return {
		es,
		e,
		ep2
	};
}
function sphere(a, b, rf, ellps, sphere) {
	if (!a) {
		var ellipse = match(ellipsoids, ellps);
		if (!ellipse) ellipse = WGS84;
		a = ellipse.a;
		b = ellipse.b;
		rf = ellipse.rf;
	}
	if (rf && !b) b = (1 - 1 / rf) * a;
	if (rf === 0 || Math.abs(a - b) < 1e-10) {
		sphere = true;
		b = a;
	}
	return {
		a,
		b,
		rf,
		sphere
	};
}
//#endregion
//#region node_modules/proj4/lib/constants/Datum.js
var datums = {
	wgs84: {
		towgs84: "0,0,0",
		ellipse: "WGS84",
		datumName: "WGS84"
	},
	ch1903: {
		towgs84: "674.374,15.056,405.346",
		ellipse: "bessel",
		datumName: "swiss"
	},
	ggrs87: {
		towgs84: "-199.87,74.79,246.62",
		ellipse: "GRS80",
		datumName: "Greek_Geodetic_Reference_System_1987"
	},
	nad83: {
		towgs84: "0,0,0",
		ellipse: "GRS80",
		datumName: "North_American_Datum_1983"
	},
	nad27: {
		nadgrids: "@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat",
		ellipse: "clrk66",
		datumName: "North_American_Datum_1927"
	},
	potsdam: {
		towgs84: "598.1,73.7,418.2,0.202,0.045,-2.455,6.7",
		ellipse: "bessel",
		datumName: "Potsdam Rauenberg 1950 DHDN"
	},
	carthage: {
		towgs84: "-263.0,6.0,431.0",
		ellipse: "clrk80ign",
		datumName: "Carthage 1934 Tunisia"
	},
	hermannskogel: {
		towgs84: "577.326,90.129,463.919,5.137,1.474,5.297,2.4232",
		ellipse: "bessel",
		datumName: "Hermannskogel"
	},
	mgi: {
		towgs84: "577.326,90.129,463.919,5.137,1.474,5.297,2.4232",
		ellipse: "bessel",
		datumName: "Militar-Geographische Institut"
	},
	osni52: {
		towgs84: "482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",
		ellipse: "airy",
		datumName: "Irish National"
	},
	ire65: {
		towgs84: "482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",
		ellipse: "mod_airy",
		datumName: "Ireland 1965"
	},
	rassadiran: {
		towgs84: "-133.63,-157.5,-158.62",
		ellipse: "intl",
		datumName: "Rassadiran"
	},
	nzgd49: {
		towgs84: "59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993",
		ellipse: "intl",
		datumName: "New Zealand Geodetic Datum 1949"
	},
	osgb36: {
		towgs84: "446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894",
		ellipse: "airy",
		datumName: "Ordnance Survey of Great Britain 1936"
	},
	s_jtsk: {
		towgs84: "589,76,480",
		ellipse: "bessel",
		datumName: "S-JTSK (Ferro)"
	},
	beduaram: {
		towgs84: "-106,-87,188",
		ellipse: "clrk80",
		datumName: "Beduaram"
	},
	gunung_segara: {
		towgs84: "-403,684,41",
		ellipse: "bessel",
		datumName: "Gunung Segara Jakarta"
	},
	rnb72: {
		towgs84: "106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1",
		ellipse: "intl",
		datumName: "Reseau National Belge 1972"
	},
	EPSG_5451: { towgs84: "6.41,-49.05,-11.28,1.5657,0.5242,6.9718,-5.7649" },
	IGNF_LURESG: { towgs84: "-192.986,13.673,-39.309,-0.4099,-2.9332,2.6881,0.43" },
	EPSG_4614: { towgs84: "-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065" },
	EPSG_4615: { towgs84: "-494.088,-312.129,279.877,-1.423,-1.013,1.59,-0.748" },
	ESRI_37241: { towgs84: "-76.822,257.457,-12.817,2.136,-0.033,-2.392,-0.031" },
	ESRI_37249: { towgs84: "-440.296,58.548,296.265,1.128,10.202,4.559,-0.438" },
	ESRI_37245: { towgs84: "-511.151,-181.269,139.609,1.05,2.703,1.798,3.071" },
	EPSG_4178: { towgs84: "24.9,-126.4,-93.2,-0.063,-0.247,-0.041,1.01" },
	EPSG_4622: { towgs84: "-472.29,-5.63,-304.12,0.4362,-0.8374,0.2563,1.8984" },
	EPSG_4625: { towgs84: "126.93,547.94,130.41,-2.7867,5.1612,-0.8584,13.8227" },
	EPSG_5252: { towgs84: "0.023,0.036,-0.068,0.00176,0.00912,-0.01136,0.00439" },
	EPSG_4314: { towgs84: "597.1,71.4,412.1,0.894,0.068,-1.563,7.58" },
	EPSG_4282: { towgs84: "-178.3,-316.7,-131.5,5.278,6.077,10.979,19.166" },
	EPSG_4231: { towgs84: "-83.11,-97.38,-117.22,0.005693,-0.044698,0.044285,0.1218" },
	EPSG_4274: { towgs84: "-230.994,102.591,25.199,0.633,-0.239,0.9,1.95" },
	EPSG_4134: { towgs84: "-180.624,-225.516,173.919,-0.81,-1.898,8.336,16.71006" },
	EPSG_4254: { towgs84: "18.38,192.45,96.82,0.056,-0.142,-0.2,-0.0013" },
	EPSG_4159: { towgs84: "-194.513,-63.978,-25.759,-3.4027,3.756,-3.352,-0.9175" },
	EPSG_4687: { towgs84: "0.072,-0.507,-0.245,0.0183,-0.0003,0.007,-0.0093" },
	EPSG_4227: { towgs84: "-83.58,-397.54,458.78,-17.595,-2.847,4.256,3.225" },
	EPSG_4746: { towgs84: "599.4,72.4,419.2,-0.062,-0.022,-2.723,6.46" },
	EPSG_4745: { towgs84: "612.4,77,440.2,-0.054,0.057,-2.797,2.55" },
	EPSG_6311: { towgs84: "8.846,-4.394,-1.122,-0.00237,-0.146528,0.130428,0.783926" },
	EPSG_4289: { towgs84: "565.7381,50.4018,465.2904,-0.395026,0.330772,-1.876073,4.07244" },
	EPSG_4230: { towgs84: "-68.863,-134.888,-111.49,-0.53,-0.14,0.57,-3.4" },
	EPSG_4154: { towgs84: "-123.02,-158.95,-168.47" },
	EPSG_4156: { towgs84: "570.8,85.7,462.8,4.998,1.587,5.261,3.56" },
	EPSG_4299: { towgs84: "482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15" },
	EPSG_4179: { towgs84: "33.4,-146.6,-76.3,-0.359,-0.053,0.844,-0.84" },
	EPSG_4313: { towgs84: "-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747" },
	EPSG_4194: { towgs84: "163.511,127.533,-159.789" },
	EPSG_4195: { towgs84: "105,326,-102.5" },
	EPSG_4196: { towgs84: "-45,417,-3.5" },
	EPSG_4611: { towgs84: "-162.619,-276.959,-161.764,0.067753,-2.243648,-1.158828,-1.094246" },
	EPSG_4633: { towgs84: "137.092,131.66,91.475,-1.9436,-11.5993,-4.3321,-7.4824" },
	EPSG_4641: { towgs84: "-408.809,366.856,-412.987,1.8842,-0.5308,2.1655,-121.0993" },
	EPSG_4643: { towgs84: "-480.26,-438.32,-643.429,16.3119,20.1721,-4.0349,-111.7002" },
	EPSG_4300: { towgs84: "482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15" },
	EPSG_4188: { towgs84: "482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15" },
	EPSG_4660: { towgs84: "982.6087,552.753,-540.873,6.681627,-31.611492,-19.848161,16.805" },
	EPSG_4662: { towgs84: "97.295,-263.247,310.882,-1.5999,0.8386,3.1409,13.3259" },
	EPSG_3906: { towgs84: "577.88891,165.22205,391.18289,4.9145,-0.94729,-13.05098,7.78664" },
	EPSG_4307: { towgs84: "-209.3622,-87.8162,404.6198,0.0046,3.4784,0.5805,-1.4547" },
	EPSG_6892: { towgs84: "-76.269,-16.683,68.562,-6.275,10.536,-4.286,-13.686" },
	EPSG_4690: { towgs84: "221.597,152.441,176.523,2.403,1.3893,0.884,11.4648" },
	EPSG_4691: { towgs84: "218.769,150.75,176.75,3.5231,2.0037,1.288,10.9817" },
	EPSG_4629: { towgs84: "72.51,345.411,79.241,-1.5862,-0.8826,-0.5495,1.3653" },
	EPSG_4630: { towgs84: "165.804,216.213,180.26,-0.6251,-0.4515,-0.0721,7.4111" },
	EPSG_4692: { towgs84: "217.109,86.452,23.711,0.0183,-0.0003,0.007,-0.0093" },
	EPSG_9333: { towgs84: "0,0,0,-0.008393,0.000749,-0.010276,0" },
	EPSG_9059: { towgs84: "0,0,0" },
	EPSG_4312: { towgs84: "601.705,84.263,485.227,4.7354,1.3145,5.393,-2.3887" },
	EPSG_4123: { towgs84: "-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496" },
	EPSG_4309: { towgs84: "-124.45,183.74,44.64,-0.4384,0.5446,-0.9706,-2.1365" },
	ESRI_104106: { towgs84: "-283.088,-70.693,117.445,-1.157,0.059,-0.652,-4.058" },
	EPSG_4281: { towgs84: "-219.247,-73.802,269.529" },
	EPSG_4322: { towgs84: "0,0,4.5" },
	EPSG_4324: { towgs84: "0,0,1.9" },
	EPSG_4284: { towgs84: "43.822,-108.842,-119.585,1.455,-0.761,0.737,0.549" },
	EPSG_4277: { towgs84: "446.448,-125.157,542.06,0.15,0.247,0.842,-20.489" },
	EPSG_4207: { towgs84: "-282.1,-72.2,120,-1.529,0.145,-0.89,-4.46" },
	EPSG_4688: { towgs84: "347.175,1077.618,2623.677,33.9058,-70.6776,9.4013,186.0647" },
	EPSG_4689: { towgs84: "410.793,54.542,80.501,-2.5596,-2.3517,-0.6594,17.3218" },
	EPSG_4720: { towgs84: "0,0,4.5" },
	EPSG_4273: { towgs84: "278.3,93,474.5,7.889,0.05,-6.61,6.21" },
	EPSG_4240: { towgs84: "204.64,834.74,293.8" },
	EPSG_4817: { towgs84: "278.3,93,474.5,7.889,0.05,-6.61,6.21" },
	ESRI_104131: { towgs84: "426.62,142.62,460.09,4.98,4.49,-12.42,-17.1" },
	EPSG_4265: { towgs84: "-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68" },
	EPSG_4263: { towgs84: "-111.92,-87.85,114.5,1.875,0.202,0.219,0.032" },
	EPSG_4298: { towgs84: "-689.5937,623.84046,-65.93566,-0.02331,1.17094,-0.80054,5.88536" },
	EPSG_4270: { towgs84: "-253.4392,-148.452,386.5267,0.15605,0.43,-0.1013,-0.0424" },
	EPSG_4229: { towgs84: "-121.8,98.1,-10.7" },
	EPSG_4220: { towgs84: "-55.5,-348,-229.2" },
	EPSG_4214: { towgs84: "12.646,-155.176,-80.863" },
	EPSG_4232: { towgs84: "-345,3,223" },
	EPSG_4238: { towgs84: "-1.977,-13.06,-9.993,0.364,0.254,0.689,-1.037" },
	EPSG_4168: { towgs84: "-170,33,326" },
	EPSG_4131: { towgs84: "199,931,318.9" },
	EPSG_4152: { towgs84: "-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0" },
	EPSG_5228: { towgs84: "572.213,85.334,461.94,4.9732,1.529,5.2484,3.5378" },
	EPSG_8351: { towgs84: "485.021,169.465,483.839,7.786342,4.397554,4.102655,0" },
	EPSG_4683: { towgs84: "-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06" },
	EPSG_4133: { towgs84: "0,0,0" },
	EPSG_7373: { towgs84: "0.819,-0.5762,-1.6446,-0.00378,-0.03317,0.00318,0.0693" },
	EPSG_9075: { towgs84: "-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0" },
	EPSG_9072: { towgs84: "-0.9102,2.0141,0.5602,0.029039,0.010065,0.010101,0" },
	EPSG_9294: { towgs84: "1.16835,-1.42001,-2.24431,-0.00822,-0.05508,0.01818,0.23388" },
	EPSG_4212: { towgs84: "-267.434,173.496,181.814,-13.4704,8.7154,7.3926,14.7492" },
	EPSG_4191: { towgs84: "-44.183,-0.58,-38.489,2.3867,2.7072,-3.5196,-8.2703" },
	EPSG_4237: { towgs84: "52.684,-71.194,-13.975,-0.312,-0.1063,-0.3729,1.0191" },
	EPSG_4740: { towgs84: "-1.08,-0.27,-0.9" },
	EPSG_4124: { towgs84: "419.3836,99.3335,591.3451,0.850389,1.817277,-7.862238,-0.99496" },
	EPSG_5681: { towgs84: "584.9636,107.7175,413.8067,1.1155,0.2824,-3.1384,7.9922" },
	EPSG_4141: { towgs84: "23.772,17.49,17.859,-0.3132,-1.85274,1.67299,-5.4262" },
	EPSG_4204: { towgs84: "-85.645,-273.077,-79.708,2.289,-1.421,2.532,3.194" },
	EPSG_4319: { towgs84: "226.702,-193.337,-35.371,-2.229,-4.391,9.238,0.9798" },
	EPSG_4200: { towgs84: "24.82,-131.21,-82.66" },
	EPSG_4130: { towgs84: "0,0,0" },
	EPSG_4127: { towgs84: "-82.875,-57.097,-156.768,-2.158,1.524,-0.982,-0.359" },
	EPSG_4149: { towgs84: "674.374,15.056,405.346" },
	EPSG_4617: { towgs84: "-0.991,1.9072,0.5129,0.02579,0.00965,0.01166,0" },
	EPSG_4663: { towgs84: "-210.502,-66.902,-48.476,2.094,-15.067,-5.817,0.485" },
	EPSG_4664: { towgs84: "-211.939,137.626,58.3,-0.089,0.251,0.079,0.384" },
	EPSG_4665: { towgs84: "-105.854,165.589,-38.312,-0.003,-0.026,0.024,-0.048" },
	EPSG_4666: { towgs84: "631.392,-66.551,481.442,1.09,-4.445,-4.487,-4.43" },
	EPSG_4756: { towgs84: "-192.873,-39.382,-111.202,-0.00205,-0.0005,0.00335,0.0188" },
	EPSG_4723: { towgs84: "-179.483,-69.379,-27.584,-7.862,8.163,6.042,-13.925" },
	EPSG_4726: { towgs84: "8.853,-52.644,180.304,-0.393,-2.323,2.96,-24.081" },
	EPSG_4267: { towgs84: "-8.0,160.0,176.0" },
	EPSG_5365: { towgs84: "-0.16959,0.35312,0.51846,0.03385,-0.16325,0.03446,0.03693" },
	EPSG_4218: { towgs84: "304.5,306.5,-318.1" },
	EPSG_4242: { towgs84: "-33.722,153.789,94.959,-8.581,-4.478,4.54,8.95" },
	EPSG_4216: { towgs84: "-292.295,248.758,429.447,4.9971,2.99,6.6906,1.0289" },
	ESRI_104105: { towgs84: "631.392,-66.551,481.442,1.09,-4.445,-4.487,-4.43" },
	ESRI_104129: { towgs84: "0,0,0" },
	EPSG_4673: { towgs84: "174.05,-25.49,112.57" },
	EPSG_4202: { towgs84: "-124,-60,154" },
	EPSG_4203: { towgs84: "-117.763,-51.51,139.061,0.292,0.443,0.277,-0.191" },
	EPSG_3819: { towgs84: "595.48,121.69,515.35,4.115,-2.9383,0.853,-3.408" },
	EPSG_8694: { towgs84: "-93.799,-132.737,-219.073,-1.844,0.648,-6.37,-0.169" },
	EPSG_4145: { towgs84: "275.57,676.78,229.6" },
	EPSG_4283: { towgs84: "0.06155,-0.01087,-0.04019,0.039492,0.032722,0.032898,-0.009994" },
	EPSG_4317: { towgs84: "2.3287,-147.0425,-92.0802,-0.309248,0.324822,0.497299,5.689063" },
	EPSG_4272: { towgs84: "59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993" },
	EPSG_4248: { towgs84: "-307.7,265.3,-363.5" },
	EPSG_5561: { towgs84: "24,-121,-76" },
	EPSG_5233: { towgs84: "-0.293,766.95,87.713,0.195704,1.695068,3.473016,-0.039338" },
	ESRI_104130: { towgs84: "-86,-98,-119" },
	ESRI_104102: { towgs84: "682,-203,480" },
	ESRI_37207: { towgs84: "7,-10,-26" },
	EPSG_4675: { towgs84: "59.935,118.4,-10.871" },
	ESRI_104109: { towgs84: "-89.121,-348.182,260.871" },
	ESRI_104112: { towgs84: "-185.583,-230.096,281.361" },
	ESRI_104113: { towgs84: "25.1,-275.6,222.6" },
	IGNF_WGS72G: { towgs84: "0,12,6" },
	IGNF_NTFG: { towgs84: "-168,-60,320" },
	IGNF_EFATE57G: { towgs84: "-127,-769,472" },
	IGNF_PGP50G: { towgs84: "324.8,153.6,172.1" },
	IGNF_REUN47G: { towgs84: "94,-948,-1262" },
	IGNF_CSG67G: { towgs84: "-186,230,110" },
	IGNF_GUAD48G: { towgs84: "-467,-16,-300" },
	IGNF_TAHI51G: { towgs84: "162,117,154" },
	IGNF_TAHAAG: { towgs84: "65,342,77" },
	IGNF_NUKU72G: { towgs84: "84,274,65" },
	IGNF_PETRELS72G: { towgs84: "365,194,166" },
	IGNF_WALL78G: { towgs84: "253,-133,-127" },
	IGNF_MAYO50G: { towgs84: "-382,-59,-262" },
	IGNF_TANNAG: { towgs84: "-139,-967,436" },
	IGNF_IGN72G: { towgs84: "-13,-348,292" },
	IGNF_ATIGG: { towgs84: "1118,23,66" },
	IGNF_FANGA84G: { towgs84: "150.57,158.33,118.32" },
	IGNF_RUSAT84G: { towgs84: "202.13,174.6,-15.74" },
	IGNF_KAUE70G: { towgs84: "126.74,300.1,-75.49" },
	IGNF_MOP90G: { towgs84: "-10.8,-1.8,12.77" },
	IGNF_MHPF67G: { towgs84: "338.08,212.58,-296.17" },
	IGNF_TAHI79G: { towgs84: "160.61,116.05,153.69" },
	IGNF_ANAA92G: { towgs84: "1.5,3.84,4.81" },
	IGNF_MARQUI72G: { towgs84: "330.91,-13.92,58.56" },
	IGNF_APAT86G: { towgs84: "143.6,197.82,74.05" },
	IGNF_TUBU69G: { towgs84: "237.17,171.61,-77.84" },
	IGNF_STPM50G: { towgs84: "11.363,424.148,373.13" },
	EPSG_4150: { towgs84: "674.374,15.056,405.346" },
	EPSG_4754: { towgs84: "-208.4058,-109.8777,-2.5764" },
	ESRI_104101: { towgs84: "372.87,149.23,585.29" },
	EPSG_4693: { towgs84: "0,-0.15,0.68" },
	EPSG_6207: { towgs84: "293.17,726.18,245.36" },
	EPSG_4153: { towgs84: "-133.63,-157.5,-158.62" },
	EPSG_4132: { towgs84: "-241.54,-163.64,396.06" },
	EPSG_4221: { towgs84: "-154.5,150.7,100.4" },
	EPSG_4266: { towgs84: "-80.7,-132.5,41.1" },
	EPSG_4193: { towgs84: "-70.9,-151.8,-41.4" },
	EPSG_5340: { towgs84: "-0.41,0.46,-0.35" },
	EPSG_4246: { towgs84: "-294.7,-200.1,525.5" },
	EPSG_4318: { towgs84: "-3.2,-5.7,2.8" },
	EPSG_4121: { towgs84: "-199.87,74.79,246.62" },
	EPSG_4223: { towgs84: "-260.1,5.5,432.2" },
	EPSG_4158: { towgs84: "-0.465,372.095,171.736" },
	EPSG_4285: { towgs84: "-128.16,-282.42,21.93" },
	EPSG_4613: { towgs84: "-404.78,685.68,45.47" },
	EPSG_4607: { towgs84: "195.671,332.517,274.607" },
	EPSG_4475: { towgs84: "-381.788,-57.501,-256.673" },
	EPSG_4208: { towgs84: "-157.84,308.54,-146.6" },
	EPSG_4743: { towgs84: "70.995,-335.916,262.898" },
	EPSG_4710: { towgs84: "-323.65,551.39,-491.22" },
	EPSG_7881: { towgs84: "-0.077,0.079,0.086" },
	EPSG_4682: { towgs84: "283.729,735.942,261.143" },
	EPSG_4739: { towgs84: "-156,-271,-189" },
	EPSG_4679: { towgs84: "-80.01,253.26,291.19" },
	EPSG_4750: { towgs84: "-56.263,16.136,-22.856" },
	EPSG_4644: { towgs84: "-10.18,-350.43,291.37" },
	EPSG_4695: { towgs84: "-103.746,-9.614,-255.95" },
	EPSG_4292: { towgs84: "-355,21,72" },
	EPSG_4302: { towgs84: "-61.702,284.488,472.052" },
	EPSG_4143: { towgs84: "-124.76,53,466.79" },
	EPSG_4606: { towgs84: "-153,153,307" },
	EPSG_4699: { towgs84: "-770.1,158.4,-498.2" },
	EPSG_4247: { towgs84: "-273.5,110.6,-357.9" },
	EPSG_4160: { towgs84: "8.88,184.86,106.69" },
	EPSG_4161: { towgs84: "-233.43,6.65,173.64" },
	EPSG_9251: { towgs84: "-9.5,122.9,138.2" },
	EPSG_9253: { towgs84: "-78.1,101.6,133.3" },
	EPSG_4297: { towgs84: "-198.383,-240.517,-107.909" },
	EPSG_4269: { towgs84: "0,0,0" },
	EPSG_4301: { towgs84: "-147,506,687" },
	EPSG_4618: { towgs84: "-59,-11,-52" },
	EPSG_4612: { towgs84: "0,0,0" },
	EPSG_4678: { towgs84: "44.585,-131.212,-39.544" },
	EPSG_4250: { towgs84: "-130,29,364" },
	EPSG_4144: { towgs84: "214,804,268" },
	EPSG_4147: { towgs84: "-17.51,-108.32,-62.39" },
	EPSG_4259: { towgs84: "-254.1,-5.36,-100.29" },
	EPSG_4164: { towgs84: "-76,-138,67" },
	EPSG_4211: { towgs84: "-378.873,676.002,-46.255" },
	EPSG_4182: { towgs84: "-422.651,-172.995,84.02" },
	EPSG_4224: { towgs84: "-143.87,243.37,-33.52" },
	EPSG_4225: { towgs84: "-205.57,168.77,-4.12" },
	EPSG_5527: { towgs84: "-67.35,3.88,-38.22" },
	EPSG_4752: { towgs84: "98,390,-22" },
	EPSG_4310: { towgs84: "-30,190,89" },
	EPSG_9248: { towgs84: "-192.26,65.72,132.08" },
	EPSG_4680: { towgs84: "124.5,-63.5,-281" },
	EPSG_4701: { towgs84: "-79.9,-158,-168.9" },
	EPSG_4706: { towgs84: "-146.21,112.63,4.05" },
	EPSG_4805: { towgs84: "682,-203,480" },
	EPSG_4201: { towgs84: "-165,-11,206" },
	EPSG_4210: { towgs84: "-157,-2,-299" },
	EPSG_4183: { towgs84: "-104,167,-38" },
	EPSG_4139: { towgs84: "11,72,-101" },
	EPSG_4668: { towgs84: "-86,-98,-119" },
	EPSG_4717: { towgs84: "-2,151,181" },
	EPSG_4732: { towgs84: "102,52,-38" },
	EPSG_4280: { towgs84: "-377,681,-50" },
	EPSG_4209: { towgs84: "-138,-105,-289" },
	EPSG_4261: { towgs84: "31,146,47" },
	EPSG_4658: { towgs84: "-73,46,-86" },
	EPSG_4721: { towgs84: "265.025,384.929,-194.046" },
	EPSG_4222: { towgs84: "-136,-108,-292" },
	EPSG_4601: { towgs84: "-255,-15,71" },
	EPSG_4602: { towgs84: "725,685,536" },
	EPSG_4603: { towgs84: "72,213.7,93" },
	EPSG_4605: { towgs84: "9,183,236" },
	EPSG_4621: { towgs84: "137,248,-430" },
	EPSG_4657: { towgs84: "-28,199,5" },
	EPSG_4316: { towgs84: "103.25,-100.4,-307.19" },
	EPSG_4642: { towgs84: "-13,-348,292" },
	EPSG_4698: { towgs84: "145,-187,103" },
	EPSG_4192: { towgs84: "-206.1,-174.7,-87.7" },
	EPSG_4311: { towgs84: "-265,120,-358" },
	EPSG_4135: { towgs84: "58,-283,-182" },
	ESRI_104138: { towgs84: "198,-226,-347" },
	EPSG_4245: { towgs84: "-11,851,5" },
	EPSG_4142: { towgs84: "-125,53,467" },
	EPSG_4213: { towgs84: "-106,-87,188" },
	EPSG_4253: { towgs84: "-133,-77,-51" },
	EPSG_4129: { towgs84: "-132,-110,-335" },
	EPSG_4713: { towgs84: "-77,-128,142" },
	EPSG_4239: { towgs84: "217,823,299" },
	EPSG_4146: { towgs84: "295,736,257" },
	EPSG_4155: { towgs84: "-83,37,124" },
	EPSG_4165: { towgs84: "-173,253,27" },
	EPSG_4672: { towgs84: "175,-38,113" },
	EPSG_4236: { towgs84: "-637,-549,-203" },
	EPSG_4251: { towgs84: "-90,40,88" },
	EPSG_4271: { towgs84: "-2,374,172" },
	EPSG_4175: { towgs84: "-88,4,101" },
	EPSG_4716: { towgs84: "298,-304,-375" },
	EPSG_4315: { towgs84: "-23,259,-9" },
	EPSG_4744: { towgs84: "-242.2,-144.9,370.3" },
	EPSG_4244: { towgs84: "-97,787,86" },
	EPSG_4293: { towgs84: "616,97,-251" },
	EPSG_4714: { towgs84: "-127,-769,472" },
	EPSG_4736: { towgs84: "260,12,-147" },
	EPSG_6883: { towgs84: "-235,-110,393" },
	EPSG_6894: { towgs84: "-63,176,185" },
	EPSG_4205: { towgs84: "-43,-163,45" },
	EPSG_4256: { towgs84: "41,-220,-134" },
	EPSG_4262: { towgs84: "639,405,60" },
	EPSG_4604: { towgs84: "174,359,365" },
	EPSG_4169: { towgs84: "-115,118,426" },
	EPSG_4620: { towgs84: "-106,-129,165" },
	EPSG_4184: { towgs84: "-203,141,53" },
	EPSG_4616: { towgs84: "-289,-124,60" },
	EPSG_9403: { towgs84: "-307,-92,127" },
	EPSG_4684: { towgs84: "-133,-321,50" },
	EPSG_4708: { towgs84: "-491,-22,435" },
	EPSG_4707: { towgs84: "114,-116,-333" },
	EPSG_4709: { towgs84: "145,75,-272" },
	EPSG_4712: { towgs84: "-205,107,53" },
	EPSG_4711: { towgs84: "124,-234,-25" },
	EPSG_4718: { towgs84: "230,-199,-752" },
	EPSG_4719: { towgs84: "211,147,111" },
	EPSG_4724: { towgs84: "208,-435,-229" },
	EPSG_4725: { towgs84: "189,-79,-202" },
	EPSG_4735: { towgs84: "647,1777,-1124" },
	EPSG_4722: { towgs84: "-794,119,-298" },
	EPSG_4728: { towgs84: "-307,-92,127" },
	EPSG_4734: { towgs84: "-632,438,-609" },
	EPSG_4727: { towgs84: "912,-58,1227" },
	EPSG_4729: { towgs84: "185,165,42" },
	EPSG_4730: { towgs84: "170,42,84" },
	EPSG_4733: { towgs84: "276,-57,149" },
	ESRI_37218: { towgs84: "230,-199,-752" },
	ESRI_37240: { towgs84: "-7,215,225" },
	ESRI_37221: { towgs84: "252,-209,-751" },
	ESRI_4305: { towgs84: "-123,-206,219" },
	ESRI_104139: { towgs84: "-73,-247,227" },
	EPSG_4748: { towgs84: "51,391,-36" },
	EPSG_4219: { towgs84: "-384,664,-48" },
	EPSG_4255: { towgs84: "-333,-222,114" },
	EPSG_4257: { towgs84: "-587.8,519.75,145.76" },
	EPSG_4646: { towgs84: "-963,510,-359" },
	EPSG_6881: { towgs84: "-24,-203,268" },
	EPSG_6882: { towgs84: "-183,-15,273" },
	EPSG_4715: { towgs84: "-104,-129,239" },
	IGNF_RGF93GDD: { towgs84: "0,0,0" },
	IGNF_RGM04GDD: { towgs84: "0,0,0" },
	IGNF_RGSPM06GDD: { towgs84: "0,0,0" },
	IGNF_RGTAAF07GDD: { towgs84: "0,0,0" },
	IGNF_RGFG95GDD: { towgs84: "0,0,0" },
	IGNF_RGNCG: { towgs84: "0,0,0" },
	IGNF_RGPFGDD: { towgs84: "0,0,0" },
	IGNF_ETRS89G: { towgs84: "0,0,0" },
	IGNF_RGR92GDD: { towgs84: "0,0,0" },
	EPSG_4173: { towgs84: "0,0,0" },
	EPSG_4180: { towgs84: "0,0,0" },
	EPSG_4619: { towgs84: "0,0,0" },
	EPSG_4667: { towgs84: "0,0,0" },
	EPSG_4075: { towgs84: "0,0,0" },
	EPSG_6706: { towgs84: "0,0,0" },
	EPSG_7798: { towgs84: "0,0,0" },
	EPSG_4661: { towgs84: "0,0,0" },
	EPSG_4669: { towgs84: "0,0,0" },
	EPSG_8685: { towgs84: "0,0,0" },
	EPSG_4151: { towgs84: "0,0,0" },
	EPSG_9702: { towgs84: "0,0,0" },
	EPSG_4758: { towgs84: "0,0,0" },
	EPSG_4761: { towgs84: "0,0,0" },
	EPSG_4765: { towgs84: "0,0,0" },
	EPSG_8997: { towgs84: "0,0,0" },
	EPSG_4023: { towgs84: "0,0,0" },
	EPSG_4670: { towgs84: "0,0,0" },
	EPSG_4694: { towgs84: "0,0,0" },
	EPSG_4148: { towgs84: "0,0,0" },
	EPSG_4163: { towgs84: "0,0,0" },
	EPSG_4167: { towgs84: "0,0,0" },
	EPSG_4189: { towgs84: "0,0,0" },
	EPSG_4190: { towgs84: "0,0,0" },
	EPSG_4176: { towgs84: "0,0,0" },
	EPSG_4659: { towgs84: "0,0,0" },
	EPSG_3824: { towgs84: "0,0,0" },
	EPSG_3889: { towgs84: "0,0,0" },
	EPSG_4046: { towgs84: "0,0,0" },
	EPSG_4081: { towgs84: "0,0,0" },
	EPSG_4558: { towgs84: "0,0,0" },
	EPSG_4483: { towgs84: "0,0,0" },
	EPSG_5013: { towgs84: "0,0,0" },
	EPSG_5264: { towgs84: "0,0,0" },
	EPSG_5324: { towgs84: "0,0,0" },
	EPSG_5354: { towgs84: "0,0,0" },
	EPSG_5371: { towgs84: "0,0,0" },
	EPSG_5373: { towgs84: "0,0,0" },
	EPSG_5381: { towgs84: "0,0,0" },
	EPSG_5393: { towgs84: "0,0,0" },
	EPSG_5489: { towgs84: "0,0,0" },
	EPSG_5593: { towgs84: "0,0,0" },
	EPSG_6135: { towgs84: "0,0,0" },
	EPSG_6365: { towgs84: "0,0,0" },
	EPSG_5246: { towgs84: "0,0,0" },
	EPSG_7886: { towgs84: "0,0,0" },
	EPSG_8431: { towgs84: "0,0,0" },
	EPSG_8427: { towgs84: "0,0,0" },
	EPSG_8699: { towgs84: "0,0,0" },
	EPSG_8818: { towgs84: "0,0,0" },
	EPSG_4757: { towgs84: "0,0,0" },
	EPSG_9140: { towgs84: "0,0,0" },
	EPSG_8086: { towgs84: "0,0,0" },
	EPSG_4686: { towgs84: "0,0,0" },
	EPSG_4737: { towgs84: "0,0,0" },
	EPSG_4702: { towgs84: "0,0,0" },
	EPSG_4747: { towgs84: "0,0,0" },
	EPSG_4749: { towgs84: "0,0,0" },
	EPSG_4674: { towgs84: "0,0,0" },
	EPSG_4755: { towgs84: "0,0,0" },
	EPSG_4759: { towgs84: "0,0,0" },
	EPSG_4762: { towgs84: "0,0,0" },
	EPSG_4763: { towgs84: "0,0,0" },
	EPSG_4764: { towgs84: "0,0,0" },
	EPSG_4166: { towgs84: "0,0,0" },
	EPSG_4170: { towgs84: "0,0,0" },
	EPSG_5546: { towgs84: "0,0,0" },
	EPSG_7844: { towgs84: "0,0,0" },
	EPSG_4818: { towgs84: "589,76,480" },
	EPSG_10328: { towgs84: "0,0,0" },
	EPSG_9782: { towgs84: "0,0,0" },
	EPSG_9777: { towgs84: "0,0,0" },
	EPSG_10690: { towgs84: "0,0,0" },
	EPSG_10639: { towgs84: "0,0,0" },
	EPSG_10739: { towgs84: "0,0,0" },
	EPSG_7686: { towgs84: "0,0,0" },
	EPSG_8900: { towgs84: "0,0,0" },
	EPSG_5886: { towgs84: "0,0,0" },
	EPSG_7683: { towgs84: "0,0,0" },
	EPSG_6668: { towgs84: "0,0,0" },
	EPSG_20046: { towgs84: "0,0,0" },
	EPSG_10299: { towgs84: "0,0,0" },
	EPSG_10310: { towgs84: "0,0,0" },
	EPSG_10475: { towgs84: "0,0,0" },
	EPSG_4742: { towgs84: "0,0,0" },
	EPSG_10671: { towgs84: "0,0,0" },
	EPSG_10762: { towgs84: "0,0,0" },
	EPSG_10725: { towgs84: "0,0,0" },
	EPSG_10791: { towgs84: "0,0,0" },
	EPSG_10800: { towgs84: "0,0,0" },
	EPSG_10305: { towgs84: "0,0,0" },
	EPSG_10941: { towgs84: "0,0,0" },
	EPSG_10968: { towgs84: "0,0,0" },
	EPSG_10875: { towgs84: "0,0,0" },
	EPSG_6318: { towgs84: "0,0,0" },
	EPSG_10910: { towgs84: "0,0,0" }
};
for (var key in datums) {
	var datum$1 = datums[key];
	if (!datum$1.datumName) continue;
	datums[datum$1.datumName] = datum$1;
}
//#endregion
//#region node_modules/proj4/lib/datum.js
function datum(datumCode, datum_params, a, b, es, ep2, nadgrids) {
	var out = {};
	out.datum_type = 5;
	if (datum_params) {
		out.datum_type = 4;
		out.datum_params = datum_params.map(parseFloat);
		if (out.datum_params[0] !== 0 || out.datum_params[1] !== 0 || out.datum_params[2] !== 0) out.datum_type = 1;
		if (out.datum_params.length > 3) {
			if (out.datum_params[3] !== 0 || out.datum_params[4] !== 0 || out.datum_params[5] !== 0 || out.datum_params[6] !== 0) {
				out.datum_type = 2;
				out.datum_params[3] *= SEC_TO_RAD;
				out.datum_params[4] *= SEC_TO_RAD;
				out.datum_params[5] *= SEC_TO_RAD;
				out.datum_params[6] = out.datum_params[6] / 1e6 + 1;
			}
		}
	}
	if (nadgrids) {
		out.datum_type = 3;
		out.grids = nadgrids;
	}
	out.a = a;
	out.b = b;
	out.es = es;
	out.ep2 = ep2;
	return out;
}
//#endregion
//#region node_modules/proj4/lib/nadgrid.js
/**
* Resources for details of NTv2 file formats:
* - https://web.archive.org/web/20140127204822if_/http://www.mgs.gov.on.ca:80/stdprodconsume/groups/content/@mgs/@iandit/documents/resourcelist/stel02_047447.pdf
* - http://mimaka.com/help/gs/html/004_NTV2%20Data%20Format.htm
*/
/**
* @typedef {Object} NadgridInfo
* @property {string} name The name of the NAD grid or 'null' if not specified.
* @property {boolean} mandatory Indicates if the grid is mandatory (true) or optional (false).
* @property {*} grid The loaded NAD grid object, or null if not loaded or not applicable.
* @property {boolean} isNull True if the grid is explicitly 'null', otherwise false.
*/
/**
* @typedef {Object} NTV2GridOptions
* @property {boolean} [includeErrorFields=true] Whether to include error fields in the subgrids.
*/
/**
* @typedef {Object} NadgridHeader
* @property {number} [nFields] Number of fields in the header.
* @property {number} [nSubgridFields] Number of fields in each subgrid header.
* @property {number} nSubgrids Number of subgrids in the file.
* @property {string} [shiftType] Type of shift (e.g., "SECONDS").
* @property {number} [fromSemiMajorAxis] Source ellipsoid semi-major axis.
* @property {number} [fromSemiMinorAxis] Source ellipsoid semi-minor axis.
* @property {number} [toSemiMajorAxis] Target ellipsoid semi-major axis.
* @property {number} [toSemiMinorAxis] Target ellipsoid semi-minor axis.
*/
/**
* @typedef {Object} Subgrid
* @property {Array<number>} ll Lower left corner of the grid in radians [longitude, latitude].
* @property {Array<number>} del Grid spacing in radians [longitude interval, latitude interval].
* @property {Array<number>} lim Number of columns in the grid [longitude columns, latitude columns].
* @property {number} [count] Total number of grid nodes.
* @property {Array} cvs Mapped node values for the grid.
*/
/** @typedef {{header: NadgridHeader, subgrids: Array<Subgrid>}} NADGrid */
var loadedNadgrids = {};
/**
* @overload
* @param {string} key - The key to associate with the loaded grid.
* @param {ArrayBuffer} data - The NTv2 grid data as an ArrayBuffer.
* @param {NTV2GridOptions} [options] - Optional parameters for loading the grid.
* @returns {NADGrid} - The loaded NAD grid information.
*/
/**
* @overload
* @param {string} key - The key to associate with the loaded grid.
* @param {import('geotiff').GeoTIFF} data - The GeoTIFF instance to read the grid from.
* @returns {{ready: Promise<NADGrid>}} - A promise that resolves to the loaded grid information.
*/
/**
* Load either a NTv2 file (.gsb) or a Geotiff (.tif) to a key that can be used in a proj string like +nadgrids=<key>. Pass the NTv2 file
* as an ArrayBuffer. Pass Geotiff as a GeoTIFF instance from the geotiff.js library.
* @param {string} key - The key to associate with the loaded grid.
* @param {ArrayBuffer|import('geotiff').GeoTIFF} data The data to load, either an ArrayBuffer for NTv2 or a GeoTIFF instance.
* @param {NTV2GridOptions} [options] Optional parameters.
* @returns {{ready: Promise<NADGrid>}|NADGrid} - A promise that resolves to the loaded grid information.
*/
function nadgrid(key, data, options) {
	if (data instanceof ArrayBuffer) return readNTV2Grid(key, data, options);
	return { ready: readGeotiffGrid(key, data) };
}
/**
* @param {string} key The key to associate with the loaded grid.
* @param {ArrayBuffer} data The NTv2 grid data as an ArrayBuffer.
* @param {NTV2GridOptions} [options] Optional parameters for loading the grid.
* @returns {NADGrid} The loaded NAD grid information.
*/
function readNTV2Grid(key, data, options) {
	var includeErrorFields = true;
	if (options !== void 0 && options.includeErrorFields === false) includeErrorFields = false;
	var view = new DataView(data);
	var isLittleEndian = detectLittleEndian(view);
	var header = readHeader(view, isLittleEndian);
	var nadgrid = {
		header,
		subgrids: readSubgrids(view, header, isLittleEndian, includeErrorFields)
	};
	loadedNadgrids[key] = nadgrid;
	return nadgrid;
}
/**
* @param {string} key The key to associate with the loaded grid.
* @param {import('geotiff').GeoTIFF} tiff The GeoTIFF instance to read the grid from.
* @returns {Promise<NADGrid>} A promise that resolves to the loaded NAD grid information.
*/
async function readGeotiffGrid(key, tiff) {
	var subgrids = [];
	var subGridCount = await tiff.getImageCount();
	for (var subgridIndex = subGridCount - 1; subgridIndex >= 0; subgridIndex--) {
		var image = await tiff.getImage(subgridIndex);
		var data = await image.readRasters();
		var lim = [image.getWidth(), image.getHeight()];
		var imageBBoxRadians = image.getBoundingBox().map(degreesToRadians);
		var modelPixelScale = typeof image.fileDirectory.getValue === "function" ? image.fileDirectory.getValue("ModelPixelScale") : 		/** @type {any} */ image.fileDirectory.ModelPixelScale;
		var del = [modelPixelScale[0], modelPixelScale[1]].map(degreesToRadians);
		var maxX = imageBBoxRadians[0] + (lim[0] - 1) * del[0];
		var minY = imageBBoxRadians[3] - (lim[1] - 1) * del[1];
		var latitudeOffsetBand = data[0];
		var longitudeOffsetBand = data[1];
		var nodes = [];
		for (let i = lim[1] - 1; i >= 0; i--) for (let j = lim[0] - 1; j >= 0; j--) {
			var index = i * lim[0] + j;
			nodes.push([-secondsToRadians(longitudeOffsetBand[index]), secondsToRadians(latitudeOffsetBand[index])]);
		}
		subgrids.push({
			del,
			lim,
			ll: [-maxX, minY],
			cvs: nodes
		});
	}
	var tifGrid = {
		header: { nSubgrids: subGridCount },
		subgrids
	};
	loadedNadgrids[key] = tifGrid;
	return tifGrid;
}
/**
* Given a proj4 value for nadgrids, return an array of loaded grids
* @param {string} nadgrids A comma-separated list of grid names, optionally prefixed with '@' to indicate optional grids.
* @returns
*/
function getNadgrids(nadgrids) {
	if (nadgrids === void 0) return null;
	return nadgrids.split(",").map(parseNadgridString);
}
/**
* @param {string} value The nadgrid string to get information for.
* @returns {NadgridInfo|null} An object with grid information, or null if the input is empty.
*/
function parseNadgridString(value) {
	if (value.length === 0) return null;
	var optional = value[0] === "@";
	if (optional) value = value.slice(1);
	if (value === "null") return {
		name: "null",
		mandatory: !optional,
		grid: null,
		isNull: true
	};
	return {
		name: value,
		mandatory: !optional,
		grid: loadedNadgrids[value] || null,
		isNull: false
	};
}
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}
function secondsToRadians(seconds) {
	return seconds / 3600 * Math.PI / 180;
}
function detectLittleEndian(view) {
	var nFields = view.getInt32(8, false);
	if (nFields === 11) return false;
	nFields = view.getInt32(8, true);
	if (nFields !== 11) console.warn("Failed to detect nadgrid endian-ness, defaulting to little-endian");
	return true;
}
function readHeader(view, isLittleEndian) {
	return {
		nFields: view.getInt32(8, isLittleEndian),
		nSubgridFields: view.getInt32(24, isLittleEndian),
		nSubgrids: view.getInt32(40, isLittleEndian),
		shiftType: decodeString(view, 56, 64).trim(),
		fromSemiMajorAxis: view.getFloat64(120, isLittleEndian),
		fromSemiMinorAxis: view.getFloat64(136, isLittleEndian),
		toSemiMajorAxis: view.getFloat64(152, isLittleEndian),
		toSemiMinorAxis: view.getFloat64(168, isLittleEndian)
	};
}
function decodeString(view, start, end) {
	return String.fromCharCode.apply(null, new Uint8Array(view.buffer.slice(start, end)));
}
function readSubgrids(view, header, isLittleEndian, includeErrorFields) {
	var gridOffset = 176;
	var grids = [];
	for (var i = 0; i < header.nSubgrids; i++) {
		var subHeader = readGridHeader(view, gridOffset, isLittleEndian);
		var nodes = readGridNodes(view, gridOffset, subHeader, isLittleEndian, includeErrorFields);
		var lngColumnCount = Math.round(1 + (subHeader.upperLongitude - subHeader.lowerLongitude) / subHeader.longitudeInterval);
		var latColumnCount = Math.round(1 + (subHeader.upperLatitude - subHeader.lowerLatitude) / subHeader.latitudeInterval);
		grids.push({
			ll: [secondsToRadians(subHeader.lowerLongitude), secondsToRadians(subHeader.lowerLatitude)],
			del: [secondsToRadians(subHeader.longitudeInterval), secondsToRadians(subHeader.latitudeInterval)],
			lim: [lngColumnCount, latColumnCount],
			count: subHeader.gridNodeCount,
			cvs: mapNodes(nodes)
		});
		var rowSize = 16;
		if (includeErrorFields === false) rowSize = 8;
		gridOffset += 176 + subHeader.gridNodeCount * rowSize;
	}
	return grids;
}
/**
* @param {*} nodes
* @returns Array<Array<number>>
*/
function mapNodes(nodes) {
	return nodes.map(function(r) {
		return [secondsToRadians(r.longitudeShift), secondsToRadians(r.latitudeShift)];
	});
}
function readGridHeader(view, offset, isLittleEndian) {
	return {
		name: decodeString(view, offset + 8, offset + 16).trim(),
		parent: decodeString(view, offset + 24, offset + 24 + 8).trim(),
		lowerLatitude: view.getFloat64(offset + 72, isLittleEndian),
		upperLatitude: view.getFloat64(offset + 88, isLittleEndian),
		lowerLongitude: view.getFloat64(offset + 104, isLittleEndian),
		upperLongitude: view.getFloat64(offset + 120, isLittleEndian),
		latitudeInterval: view.getFloat64(offset + 136, isLittleEndian),
		longitudeInterval: view.getFloat64(offset + 152, isLittleEndian),
		gridNodeCount: view.getInt32(offset + 168, isLittleEndian)
	};
}
function readGridNodes(view, offset, gridHeader, isLittleEndian, includeErrorFields) {
	var nodesOffset = offset + 176;
	var gridRecordLength = 16;
	if (includeErrorFields === false) gridRecordLength = 8;
	var gridShiftRecords = [];
	for (var i = 0; i < gridHeader.gridNodeCount; i++) {
		var record = {
			latitudeShift: view.getFloat32(nodesOffset + i * gridRecordLength, isLittleEndian),
			longitudeShift: view.getFloat32(nodesOffset + i * gridRecordLength + 4, isLittleEndian)
		};
		if (includeErrorFields !== false) {
			record.latitudeAccuracy = view.getFloat32(nodesOffset + i * gridRecordLength + 8, isLittleEndian);
			record.longitudeAccuracy = view.getFloat32(nodesOffset + i * gridRecordLength + 12, isLittleEndian);
		}
		gridShiftRecords.push(record);
	}
	return gridShiftRecords;
}
//#endregion
//#region node_modules/proj4/lib/Proj.js
/**
* @typedef {Object} DatumDefinition
* @property {number} datum_type - The type of datum.
* @property {number} a - Semi-major axis of the ellipsoid.
* @property {number} b - Semi-minor axis of the ellipsoid.
* @property {number} es - Eccentricity squared of the ellipsoid.
* @property {number} ep2 - Second eccentricity squared of the ellipsoid.
*/
/**
* @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} srsCode
* @param {(errorMessage?: string, instance?: Projection) => void} [callback]
*/
function Projection(srsCode, callback) {
	if (!(this instanceof Projection)) return new Projection(srsCode);
	/** @type {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} */
	this.forward = null;
	/** @type {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} */
	this.inverse = null;
	/** @type {function(): void} */
	this.init = null;
	/** @type {string} */
	this.name;
	/** @type {string} */
	this.axis;
	/** @type {Array<string>} */
	this.names = null;
	/** @type {string} */
	this.title;
	callback = callback || function(error) {
		if (error) throw error;
	};
	var json = parse$1(srsCode);
	if (typeof json !== "object") {
		callback("Could not parse to valid json: " + srsCode);
		return;
	}
	var ourProj = Projection.projections.get(json.projName);
	if (!ourProj) {
		callback("Could not get projection name from: " + srsCode);
		return;
	}
	if (json.datumCode && json.datumCode !== "none") {
		var datumDef = match(datums, json.datumCode);
		if (datumDef) {
			json.datum_params = json.datum_params || (datumDef.towgs84 ? datumDef.towgs84.split(",") : null);
			json.ellps = datumDef.ellipse;
			json.datumName = datumDef.datumName ? datumDef.datumName : json.datumCode;
		}
	}
	json.axis = json.axis || "enu";
	json.ellps = json.ellps || "wgs84";
	json.lat1 = json.lat1 || json.lat0;
	var sphere_ = sphere(json.a, json.b, json.rf, json.ellps, json.sphere);
	var ecc = eccentricity(sphere_.a, sphere_.b, sphere_.rf, json.R_A);
	var nadgrids = getNadgrids(json.nadgrids);
	/** @type {DatumDefinition} */
	var datumObj = json.datum || datum(json.datumCode, json.datum_params, sphere_.a, sphere_.b, ecc.es, ecc.ep2, nadgrids);
	extend_default(this, json);
	extend_default(this, ourProj);
	this.a = sphere_.a;
	this.b = sphere_.b;
	this.rf = sphere_.rf;
	this.sphere = sphere_.sphere;
	this.es = ecc.es;
	this.e = ecc.e;
	this.ep2 = ecc.ep2;
	this.datum = datumObj;
	if ("init" in this && typeof this.init === "function") this.init();
	if (!this.k0) this.k0 = 1;
	callback(null, this);
}
Projection.projections = projections_default;
Projection.projections.start();
//#endregion
//#region node_modules/proj4/lib/datumUtils.js
function compareDatums(source, dest) {
	if (source.datum_type !== dest.datum_type) return false;
	else if (source.a !== dest.a || Math.abs(source.es - dest.es) > 5e-11) return false;
	else if (source.datum_type === 1) return source.datum_params[0] === dest.datum_params[0] && source.datum_params[1] === dest.datum_params[1] && source.datum_params[2] === dest.datum_params[2];
	else if (source.datum_type === 2) return source.datum_params[0] === dest.datum_params[0] && source.datum_params[1] === dest.datum_params[1] && source.datum_params[2] === dest.datum_params[2] && source.datum_params[3] === dest.datum_params[3] && source.datum_params[4] === dest.datum_params[4] && source.datum_params[5] === dest.datum_params[5] && source.datum_params[6] === dest.datum_params[6];
	else return true;
}
function geodeticToGeocentric(p, es, a) {
	var Longitude = p.x;
	var Latitude = p.y;
	var Height = p.z ? p.z : 0;
	var Rn;
	var Sin_Lat;
	var Sin2_Lat;
	var Cos_Lat;
	if (Latitude < -HALF_PI && Latitude > -1.001 * HALF_PI) Latitude = -HALF_PI;
	else if (Latitude > HALF_PI && Latitude < 1.001 * HALF_PI) Latitude = HALF_PI;
	else if (Latitude < -HALF_PI) return {
		x: -Infinity,
		y: -Infinity,
		z: p.z
	};
	else if (Latitude > HALF_PI) return {
		x: Infinity,
		y: Infinity,
		z: p.z
	};
	if (Longitude > Math.PI) Longitude -= 2 * Math.PI;
	Sin_Lat = Math.sin(Latitude);
	Cos_Lat = Math.cos(Latitude);
	Sin2_Lat = Sin_Lat * Sin_Lat;
	Rn = a / Math.sqrt(1 - es * Sin2_Lat);
	return {
		x: (Rn + Height) * Cos_Lat * Math.cos(Longitude),
		y: (Rn + Height) * Cos_Lat * Math.sin(Longitude),
		z: (Rn * (1 - es) + Height) * Sin_Lat
	};
}
function geocentricToGeodetic(p, es, a, b) {
	var genau = 1e-12;
	var genau2 = genau * genau;
	var maxiter = 30;
	var P;
	var RR;
	var CT;
	var ST;
	var RX;
	var RK;
	var RN;
	var CPHI0;
	var SPHI0;
	var CPHI;
	var SPHI;
	var SDPHI;
	var iter;
	var X = p.x;
	var Y = p.y;
	var Z = p.z ? p.z : 0;
	var Longitude;
	var Latitude;
	var Height;
	P = Math.sqrt(X * X + Y * Y);
	RR = Math.sqrt(X * X + Y * Y + Z * Z);
	if (P / a < genau) {
		Longitude = 0;
		if (RR / a < genau) {
			Latitude = HALF_PI;
			Height = -b;
			return {
				x: p.x,
				y: p.y,
				z: p.z
			};
		}
	} else Longitude = Math.atan2(Y, X);
	CT = Z / RR;
	ST = P / RR;
	RX = 1 / Math.sqrt(1 - es * (2 - es) * ST * ST);
	CPHI0 = ST * (1 - es) * RX;
	SPHI0 = CT * RX;
	iter = 0;
	do {
		iter++;
		RN = a / Math.sqrt(1 - es * SPHI0 * SPHI0);
		Height = P * CPHI0 + Z * SPHI0 - RN * (1 - es * SPHI0 * SPHI0);
		RK = es * RN / (RN + Height);
		RX = 1 / Math.sqrt(1 - RK * (2 - RK) * ST * ST);
		CPHI = ST * (1 - RK) * RX;
		SPHI = CT * RX;
		SDPHI = SPHI * CPHI0 - CPHI * SPHI0;
		CPHI0 = CPHI;
		SPHI0 = SPHI;
	} while (SDPHI * SDPHI > genau2 && iter < maxiter);
	Latitude = Math.atan(SPHI / Math.abs(CPHI));
	return {
		x: Longitude,
		y: Latitude,
		z: Height
	};
}
/** point object, nothing fancy, just allows values to be
passed back and forth by reference rather than by value.
Other point classes may be used as long as they have
x and y properties, which will get modified in the transform method.
*/
function geocentricToWgs84(p, datum_type, datum_params) {
	if (datum_type === 1) return {
		x: p.x + datum_params[0],
		y: p.y + datum_params[1],
		z: p.z + datum_params[2]
	};
	else if (datum_type === 2) {
		var Dx_BF = datum_params[0];
		var Dy_BF = datum_params[1];
		var Dz_BF = datum_params[2];
		var Rx_BF = datum_params[3];
		var Ry_BF = datum_params[4];
		var Rz_BF = datum_params[5];
		var M_BF = datum_params[6];
		return {
			x: M_BF * (p.x - Rz_BF * p.y + Ry_BF * p.z) + Dx_BF,
			y: M_BF * (Rz_BF * p.x + p.y - Rx_BF * p.z) + Dy_BF,
			z: M_BF * (-Ry_BF * p.x + Rx_BF * p.y + p.z) + Dz_BF
		};
	}
}
function geocentricFromWgs84(p, datum_type, datum_params) {
	if (datum_type === 1) return {
		x: p.x - datum_params[0],
		y: p.y - datum_params[1],
		z: p.z - datum_params[2]
	};
	else if (datum_type === 2) {
		var Dx_BF = datum_params[0];
		var Dy_BF = datum_params[1];
		var Dz_BF = datum_params[2];
		var Rx_BF = datum_params[3];
		var Ry_BF = datum_params[4];
		var Rz_BF = datum_params[5];
		var M_BF = datum_params[6];
		var x_tmp = (p.x - Dx_BF) / M_BF;
		var y_tmp = (p.y - Dy_BF) / M_BF;
		var z_tmp = (p.z - Dz_BF) / M_BF;
		return {
			x: x_tmp + Rz_BF * y_tmp - Ry_BF * z_tmp,
			y: -Rz_BF * x_tmp + y_tmp + Rx_BF * z_tmp,
			z: Ry_BF * x_tmp - Rx_BF * y_tmp + z_tmp
		};
	}
}
//#endregion
//#region node_modules/proj4/lib/datum_transform.js
function checkParams(type) {
	return type === 1 || type === 2;
}
function datum_transform_default(source, dest, point) {
	if (compareDatums(source, dest)) return point;
	if (source.datum_type === 5 || dest.datum_type === 5) return point;
	var source_a = source.a;
	var source_es = source.es;
	if (source.datum_type === 3) {
		if (applyGridShift(source, false, point) !== 0) return;
		source_a = SRS_WGS84_SEMIMAJOR;
		source_es = SRS_WGS84_ESQUARED;
	}
	var dest_a = dest.a;
	var dest_b = dest.b;
	var dest_es = dest.es;
	if (dest.datum_type === 3) {
		dest_a = SRS_WGS84_SEMIMAJOR;
		dest_b = SRS_WGS84_SEMIMINOR;
		dest_es = SRS_WGS84_ESQUARED;
	}
	if (source_es === dest_es && source_a === dest_a && !checkParams(source.datum_type) && !checkParams(dest.datum_type)) return point;
	point = geodeticToGeocentric(point, source_es, source_a);
	if (checkParams(source.datum_type)) point = geocentricToWgs84(point, source.datum_type, source.datum_params);
	if (checkParams(dest.datum_type)) point = geocentricFromWgs84(point, dest.datum_type, dest.datum_params);
	point = geocentricToGeodetic(point, dest_es, dest_a, dest_b);
	if (dest.datum_type === 3) {
		if (applyGridShift(dest, true, point) !== 0) return;
	}
	return point;
}
function applyGridShift(source, inverse, point) {
	if (source.grids === null || source.grids.length === 0) {
		console.log("Grid shift grids not found");
		return -1;
	}
	var input = {
		x: -point.x,
		y: point.y
	};
	var output = {
		x: NaN,
		y: NaN
	};
	var attemptedGrids = [];
	outer: for (var i = 0; i < source.grids.length; i++) {
		var grid = source.grids[i];
		attemptedGrids.push(grid.name);
		if (grid.isNull) {
			output = input;
			break;
		}
		if (grid.grid === null) {
			if (grid.mandatory) {
				console.log("Unable to find mandatory grid '" + grid.name + "'");
				return -1;
			}
			continue;
		}
		var subgrids = grid.grid.subgrids;
		for (var j = 0, jj = subgrids.length; j < jj; j++) {
			var subgrid = subgrids[j];
			var epsilon = (Math.abs(subgrid.del[1]) + Math.abs(subgrid.del[0])) / 1e4;
			var minX = subgrid.ll[0] - epsilon;
			var minY = subgrid.ll[1] - epsilon;
			var maxX = subgrid.ll[0] + (subgrid.lim[0] - 1) * subgrid.del[0] + epsilon;
			var maxY = subgrid.ll[1] + (subgrid.lim[1] - 1) * subgrid.del[1] + epsilon;
			if (minY > input.y || minX > input.x || maxY < input.y || maxX < input.x) continue;
			output = applySubgridShift(input, inverse, subgrid);
			if (!isNaN(output.x)) break outer;
		}
	}
	if (isNaN(output.x)) {
		console.log("Failed to find a grid shift table for location '" + -input.x * R2D + " " + input.y * R2D + " tried: '" + attemptedGrids + "'");
		return -1;
	}
	point.x = -output.x;
	point.y = output.y;
	return 0;
}
function applySubgridShift(pin, inverse, ct) {
	var val = {
		x: NaN,
		y: NaN
	};
	if (isNaN(pin.x)) return val;
	var tb = {
		x: pin.x,
		y: pin.y
	};
	tb.x -= ct.ll[0];
	tb.y -= ct.ll[1];
	tb.x = adjust_lon_default(tb.x - Math.PI) + Math.PI;
	var t = nadInterpolate(tb, ct);
	if (inverse) {
		if (isNaN(t.x)) return val;
		t.x = tb.x - t.x;
		t.y = tb.y - t.y;
		var i = 9, tol = 1e-12;
		var dif, del;
		do {
			del = nadInterpolate(t, ct);
			if (isNaN(del.x)) {
				console.log("Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.");
				break;
			}
			dif = {
				x: tb.x - (del.x + t.x),
				y: tb.y - (del.y + t.y)
			};
			t.x += dif.x;
			t.y += dif.y;
		} while (i-- && Math.abs(dif.x) > tol && Math.abs(dif.y) > tol);
		if (i < 0) {
			console.log("Inverse grid shift iterator failed to converge.");
			return val;
		}
		val.x = adjust_lon_default(t.x + ct.ll[0]);
		val.y = t.y + ct.ll[1];
	} else if (!isNaN(t.x)) {
		val.x = pin.x + t.x;
		val.y = pin.y + t.y;
	}
	return val;
}
function nadInterpolate(pin, ct) {
	var t = {
		x: pin.x / ct.del[0],
		y: pin.y / ct.del[1]
	};
	var indx = {
		x: Math.floor(t.x),
		y: Math.floor(t.y)
	};
	var frct = {
		x: t.x - 1 * indx.x,
		y: t.y - 1 * indx.y
	};
	var val = {
		x: NaN,
		y: NaN
	};
	var inx;
	if (indx.x < 0 || indx.x >= ct.lim[0]) return val;
	if (indx.y < 0 || indx.y >= ct.lim[1]) return val;
	inx = indx.y * ct.lim[0] + indx.x;
	var f00 = {
		x: ct.cvs[inx][0],
		y: ct.cvs[inx][1]
	};
	inx++;
	var f10 = {
		x: ct.cvs[inx][0],
		y: ct.cvs[inx][1]
	};
	inx += ct.lim[0];
	var f11 = {
		x: ct.cvs[inx][0],
		y: ct.cvs[inx][1]
	};
	inx--;
	var f01 = {
		x: ct.cvs[inx][0],
		y: ct.cvs[inx][1]
	};
	var m11 = frct.x * frct.y, m10 = frct.x * (1 - frct.y), m00 = (1 - frct.x) * (1 - frct.y), m01 = (1 - frct.x) * frct.y;
	val.x = m00 * f00.x + m10 * f10.x + m01 * f01.x + m11 * f11.x;
	val.y = m00 * f00.y + m10 * f10.y + m01 * f01.y + m11 * f11.y;
	return val;
}
//#endregion
//#region node_modules/proj4/lib/adjust_axis.js
var order = [
	"x",
	"y",
	"z"
];
/**
* Convert a point in a given CRS axis order to ENU (east/north/up) order
* @param {import('./defs').ProjectionDefinition} crs
* @param {import('./core').InterfaceCoordinates} point
* @returns {import('./core').InterfaceCoordinates | null}
*/
function adjustAxisToEnu(crs, point) {
	/** @type {import("./core").InterfaceCoordinates} */
	const out = {};
	for (let i = 0, ii = crs.axis.length; i < ii; i++) {
		if (i === 2 && point.z === void 0) continue;
		let v = point[order[i]];
		switch (crs.axis[i]) {
			case "e":
				out.x = v;
				break;
			case "w":
				out.x = -v;
				break;
			case "n":
				out.y = v;
				break;
			case "s":
				out.y = -v;
				break;
			case "u":
				out.z = v;
				break;
			case "d":
				out.z = -v;
				break;
			default: return null;
		}
	}
	return out;
}
/**
* Convert a point in ENU (east/north/up) order to the given CRS axis order.
* @param {import('./defs').ProjectionDefinition} crs
* @param {import('./core').InterfaceCoordinates} point
* @returns {import('./core').InterfaceCoordinates | null}
*/
function adjustAxisFromEnu(crs, point) {
	const out = {};
	for (let i = 0, ii = crs.axis.length; i < ii; i++) {
		if (i === 2 && point.z === void 0) continue;
		switch (crs.axis[i]) {
			case "e":
				out[order[i]] = point.x;
				break;
			case "w":
				out[order[i]] = -point.x;
				break;
			case "n":
				out[order[i]] = point.y;
				break;
			case "s":
				out[order[i]] = -point.y;
				break;
			case "u":
				out[order[i]] = point.z;
				break;
			case "d":
				out[order[i]] = -point.z;
				break;
			default: return null;
		}
	}
	return out;
}
//#endregion
//#region node_modules/proj4/lib/common/toPoint.js
/**
* @param {Array<number>} array
* @returns {import("../core").InterfaceCoordinates}
*/
function toPoint_default(array) {
	var out = {
		x: array[0],
		y: array[1]
	};
	if (array.length > 2) out.z = array[2];
	if (array.length > 3) out.m = array[3];
	return out;
}
//#endregion
//#region node_modules/proj4/lib/checkSanity.js
function checkSanity_default(point) {
	checkCoord(point.x);
	checkCoord(point.y);
}
function checkCoord(num) {
	if (typeof Number.isFinite === "function") {
		if (Number.isFinite(num)) return;
		throw new TypeError("coordinates must be finite numbers");
	}
	if (typeof num !== "number" || num !== num || !isFinite(num)) throw new TypeError("coordinates must be finite numbers");
}
//#endregion
//#region node_modules/proj4/lib/transform.js
function checkNotWGS(source, dest) {
	return (source.datum.datum_type === 1 || source.datum.datum_type === 2 || source.datum.datum_type === 3) && dest.datumCode !== "WGS84" || (dest.datum.datum_type === 1 || dest.datum.datum_type === 2 || dest.datum.datum_type === 3) && source.datumCode !== "WGS84";
}
/**
* Internal transform: accepts an already-cloned point object, returns transformed point object.
* @param {import('./defs').ProjectionDefinition} source
* @param {import('./defs').ProjectionDefinition} dest
* @param {import('./core').InterfaceCoordinates} point
* @param {boolean} [enforceAxis]
* @returns {import('./core').InterfaceCoordinates | undefined}
*/
function transformInternal(source, dest, point, enforceAxis) {
	var wgs84;
	var hasZ = point.z !== void 0;
	checkSanity_default(point);
	if (source.datum && dest.datum && checkNotWGS(source, dest)) {
		wgs84 = new Projection("WGS84");
		point = transformInternal(source, wgs84, point, enforceAxis);
		source = wgs84;
	}
	if (enforceAxis && source.axis !== "enu") point = adjustAxisToEnu(source, point);
	if (source.projName === "longlat") point = {
		x: point.x * D2R$1,
		y: point.y * D2R$1,
		z: point.z || 0
	};
	else {
		if (source.to_meter) point = {
			x: point.x * source.to_meter,
			y: point.y * source.to_meter,
			z: point.z || 0
		};
		point = source.inverse(point);
		if (!point) return;
	}
	if (source.from_greenwich) point.x += source.from_greenwich;
	point = datum_transform_default(source.datum, dest.datum, point);
	if (!point) return;
	point = point;
	if (dest.from_greenwich) point = {
		x: point.x - dest.from_greenwich,
		y: point.y,
		z: point.z || 0
	};
	if (dest.projName === "longlat") {
		if (dest.long_wrap !== void 0) point.x = dest.long_wrap + adjust_lon_default(point.x - dest.long_wrap);
		point = {
			x: point.x * R2D,
			y: point.y * R2D,
			z: point.z || 0
		};
	} else {
		point = dest.forward(point);
		if (dest.to_meter) point = {
			x: point.x / dest.to_meter,
			y: point.y / dest.to_meter,
			z: point.z || 0
		};
	}
	if (enforceAxis && dest.axis !== "enu") return adjustAxisFromEnu(dest, point);
	if (point && !hasZ && dest.projName !== "geocent") delete point.z;
	return point;
}
/**
* @param {import('./defs').ProjectionDefinition} source
* @param {import('./defs').ProjectionDefinition} dest
* @param {import('./core').TemplateCoordinates} point
* @param {boolean} [enforceAxis]
* @returns {import('./core').InterfaceCoordinates | undefined}
*/
function transform(source, dest, point, enforceAxis) {
	var pt;
	if (Array.isArray(point)) pt = toPoint_default(point);
	else pt = {
		x: point.x,
		y: point.y,
		z: point.z,
		m: point.m
	};
	return transformInternal(source, dest, pt, enforceAxis);
}
//#endregion
//#region node_modules/proj4/lib/core.js
var wgs84 = Projection("WGS84");
/**
* @typedef {{x: number, y: number, z?: number, m?: number}} InterfaceCoordinates
*/
/**
* @typedef {Array<number> | InterfaceCoordinates} TemplateCoordinates
*/
/**
* @typedef {Object} Converter
* @property {<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} forward
* @property {<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} inverse
* @property {proj} [oProj]
*/
/**
* @typedef {Object} PROJJSONDefinition
* @property {string} [$schema]
* @property {string} type
* @property {string} [name]
* @property {{authority: string, code: number}} [id]
* @property {string} [scope]
* @property {string} [area]
* @property {{south_latitude: number, west_longitude: number, north_latitude: number, east_longitude: number}} [bbox]
* @property {PROJJSONDefinition[]} [components]
* @property {{type: string, name: string}} [datum]
* @property {{
*   name: string,
*   members: Array<{
*     name: string,
*     id?: {authority: string, code: number}
*   }>,
*   ellipsoid?: {
*     name: string,
*     semi_major_axis: number,
*     inverse_flattening?: number
*   },
*   accuracy?: string,
*   id?: {authority: string, code: number}
* }} [datum_ensemble]
* @property {{
*   subtype: string,
*   axis: Array<{
*     name: string,
*     abbreviation?: string,
*     direction: string,
*     unit: string
*   }>
* }} [coordinate_system]
* @property {{
*   name: string,
*   method: {name: string},
*   parameters: Array<{
*     name: string,
*     value: number,
*     unit?: string
*   }>
* }} [conversion]
* @property {{
*   name: string,
*   method: {name: string},
*   parameters: Array<{
*     name: string,
*     value: number,
*     unit?: string,
*     type?: string,
*     file_name?: string
*   }>
* }} [transformation]
*/
/**
* @template {TemplateCoordinates} T
* @param {proj} from
* @param {proj} to
* @param {T} coords
* @param {boolean} [enforceAxis]
* @returns {T}
*/
function transformer(from, to, coords, enforceAxis) {
	var out, geocent, keys;
	if (Array.isArray(coords)) {
		out = transformInternal(from, to, toPoint_default(coords), enforceAxis) || {
			x: NaN,
			y: NaN
		};
		if (coords.length > 2) {
			geocent = typeof from.name !== "undefined" && from.name === "geocent" || typeof to.name !== "undefined" && to.name === "geocent";
			if (geocent) {
				if (typeof out.z === "number") return [
					out.x,
					out.y,
					out.z
				].concat(coords.slice(3));
				return [
					out.x,
					out.y,
					coords[2]
				].concat(coords.slice(3));
			}
			if (enforceAxis && typeof out.z === "number") return [
				out.x,
				out.y,
				out.z
			].concat(coords.slice(3));
			return [out.x, out.y].concat(coords.slice(2));
		}
		return [out.x, out.y];
	} else {
		out = transformInternal(from, to, {
			x: coords.x,
			y: coords.y,
			z: coords.z,
			m: coords.m
		}, enforceAxis) || {
			x: NaN,
			y: NaN
		};
		keys = Object.keys(coords);
		if (keys.length === 2) return out;
		geocent = typeof from.name !== "undefined" && from.name === "geocent" || typeof to.name !== "undefined" && to.name === "geocent";
		keys.forEach(function(key) {
			if (key === "x" || key === "y") return;
			if (key === "z" && (geocent || enforceAxis)) return;
			out[key] = coords[key];
		});
		return out;
	}
}
/**
* @param {proj | string | PROJJSONDefinition | Converter} item
* @returns {import('./Proj').default}
*/
function checkProj(item) {
	if (item instanceof Projection) return item;
	if (typeof item === "object" && "oProj" in item) return item.oProj;
	return Projection(item);
}
/**
* @overload
* @param {string | PROJJSONDefinition | proj} toProj
* @returns {Converter}
*/
/**
* @overload
* @param {string | PROJJSONDefinition | proj} fromProj
* @param {string | PROJJSONDefinition | proj} toProj
* @returns {Converter}
*/
/**
* @template {TemplateCoordinates} T
* @overload
* @param {string | PROJJSONDefinition | proj} toProj
* @param {T} coord
* @returns {T}
*/
/**
* @template {TemplateCoordinates} T
* @overload
* @param {string | PROJJSONDefinition | proj} fromProj
* @param {string | PROJJSONDefinition | proj} toProj
* @param {T} coord
* @returns {T}
*/
/**
* @template {TemplateCoordinates} T
* @param {string | PROJJSONDefinition | proj} fromProjOrToProj
* @param {string | PROJJSONDefinition | proj | TemplateCoordinates} [toProjOrCoord]
* @param {T} [coord]
* @returns {T|Converter}
*/
function proj4$1(fromProjOrToProj, toProjOrCoord, coord) {
	/** @type {proj} */
	var fromProj;
	/** @type {proj} */
	var toProj;
	var single = false;
	/** @type {Converter} */
	var obj;
	if (typeof toProjOrCoord === "undefined") {
		toProj = checkProj(fromProjOrToProj);
		fromProj = wgs84;
		single = true;
	} else if (typeof toProjOrCoord.x !== "undefined" || Array.isArray(toProjOrCoord)) {
		coord = toProjOrCoord;
		toProj = checkProj(fromProjOrToProj);
		fromProj = wgs84;
		single = true;
	}
	if (!fromProj) fromProj = checkProj(fromProjOrToProj);
	if (!toProj) toProj = checkProj(toProjOrCoord);
	if (coord) return transformer(fromProj, toProj, coord);
	else {
		obj = {
			/**
			* @template {TemplateCoordinates} T
			* @param {T} coords
			* @param {boolean=} enforceAxis
			* @returns {T}
			*/
			forward: function(coords, enforceAxis) {
				return transformer(fromProj, toProj, coords, enforceAxis);
			},
			/**
			* @template {TemplateCoordinates} T
			* @param {T} coords
			* @param {boolean=} enforceAxis
			* @returns {T}
			*/
			inverse: function(coords, enforceAxis) {
				return transformer(toProj, fromProj, coords, enforceAxis);
			}
		};
		if (single) obj.oProj = toProj;
		return obj;
	}
}
//#endregion
//#region node_modules/mgrs/mgrs.js
/**
* UTM zones are grouped, and assigned to one of a group of 6
* sets.
*
* {int} @private
*/
var NUM_100K_SETS = 6;
/**
* The column letters (for easting) of the lower left value, per
* set.
*
* {string} @private
*/
var SET_ORIGIN_COLUMN_LETTERS = "AJSAJS";
/**
* The row letters (for northing) of the lower left value, per
* set.
*
* {string} @private
*/
var SET_ORIGIN_ROW_LETTERS = "AFAFAF";
var A = 65;
var I = 73;
var O = 79;
var V = 86;
var Z = 90;
var mgrs_default = {
	forward: forward$32,
	inverse: inverse$32,
	toPoint
};
/**
* Conversion of lat/lon to MGRS.
*
* @param {object} ll Object literal with lat and lon properties on a
*     WGS84 ellipsoid.
* @param {int} accuracy Accuracy in digits (5 for 1 m, 4 for 10 m, 3 for
*      100 m, 2 for 1000 m or 1 for 10000 m). Optional, default is 5.
* @return {string} the MGRS string for the given location and accuracy.
*/
function forward$32(ll, accuracy) {
	accuracy = accuracy || 5;
	return encode(LLtoUTM({
		lat: ll[1],
		lon: ll[0]
	}), accuracy);
}
/**
* Conversion of MGRS to lat/lon.
*
* @param {string} mgrs MGRS string.
* @return {array} An array with left (longitude), bottom (latitude), right
*     (longitude) and top (latitude) values in WGS84, representing the
*     bounding box for the provided MGRS reference.
*/
function inverse$32(mgrs) {
	var bbox = UTMtoLL(decode(mgrs.toUpperCase()));
	if (bbox.lat && bbox.lon) return [
		bbox.lon,
		bbox.lat,
		bbox.lon,
		bbox.lat
	];
	return [
		bbox.left,
		bbox.bottom,
		bbox.right,
		bbox.top
	];
}
function toPoint(mgrs) {
	var bbox = UTMtoLL(decode(mgrs.toUpperCase()));
	if (bbox.lat && bbox.lon) return [bbox.lon, bbox.lat];
	return [(bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2];
}
/**
* Conversion from degrees to radians.
*
* @private
* @param {number} deg the angle in degrees.
* @return {number} the angle in radians.
*/
function degToRad(deg) {
	return deg * (Math.PI / 180);
}
/**
* Conversion from radians to degrees.
*
* @private
* @param {number} rad the angle in radians.
* @return {number} the angle in degrees.
*/
function radToDeg(rad) {
	return 180 * (rad / Math.PI);
}
/**
* Converts a set of Longitude and Latitude co-ordinates to UTM
* using the WGS84 ellipsoid.
*
* @private
* @param {object} ll Object literal with lat and lon properties
*     representing the WGS84 coordinate to be converted.
* @return {object} Object literal containing the UTM value with easting,
*     northing, zoneNumber and zoneLetter properties, and an optional
*     accuracy property in digits. Returns null if the conversion failed.
*/
function LLtoUTM(ll) {
	var Lat = ll.lat;
	var Long = ll.lon;
	var a = 6378137;
	var eccSquared = .00669438;
	var k0 = .9996;
	var LongOrigin;
	var eccPrimeSquared;
	var N, T, C, A, M;
	var LatRad = degToRad(Lat);
	var LongRad = degToRad(Long);
	var LongOriginRad;
	var ZoneNumber = Math.floor((Long + 180) / 6) + 1;
	if (Long === 180) ZoneNumber = 60;
	if (Lat >= 56 && Lat < 64 && Long >= 3 && Long < 12) ZoneNumber = 32;
	if (Lat >= 72 && Lat < 84) {
		if (Long >= 0 && Long < 9) ZoneNumber = 31;
		else if (Long >= 9 && Long < 21) ZoneNumber = 33;
		else if (Long >= 21 && Long < 33) ZoneNumber = 35;
		else if (Long >= 33 && Long < 42) ZoneNumber = 37;
	}
	LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3;
	LongOriginRad = degToRad(LongOrigin);
	eccPrimeSquared = eccSquared / (1 - eccSquared);
	N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
	T = Math.tan(LatRad) * Math.tan(LatRad);
	C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
	A = Math.cos(LatRad) * (LongRad - LongOriginRad);
	M = a * ((1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256) * LatRad - (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(2 * LatRad) + (15 * eccSquared * eccSquared / 256 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(4 * LatRad) - 35 * eccSquared * eccSquared * eccSquared / 3072 * Math.sin(6 * LatRad));
	var UTMEasting = k0 * N * (A + (1 - T + C) * A * A * A / 6 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A / 120) + 5e5;
	var UTMNorthing = k0 * (M + N * Math.tan(LatRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720));
	if (Lat < 0) UTMNorthing += 1e7;
	return {
		northing: Math.round(UTMNorthing),
		easting: Math.round(UTMEasting),
		zoneNumber: ZoneNumber,
		zoneLetter: getLetterDesignator(Lat)
	};
}
/**
* Converts UTM coords to lat/long, using the WGS84 ellipsoid. This is a convenience
* class where the Zone can be specified as a single string eg."60N" which
* is then broken down into the ZoneNumber and ZoneLetter.
*
* @private
* @param {object} utm An object literal with northing, easting, zoneNumber
*     and zoneLetter properties. If an optional accuracy property is
*     provided (in meters), a bounding box will be returned instead of
*     latitude and longitude.
* @return {object} An object literal containing either lat and lon values
*     (if no accuracy was provided), or top, right, bottom and left values
*     for the bounding box calculated according to the provided accuracy.
*     Returns null if the conversion failed.
*/
function UTMtoLL(utm) {
	var UTMNorthing = utm.northing;
	var UTMEasting = utm.easting;
	var zoneLetter = utm.zoneLetter;
	var zoneNumber = utm.zoneNumber;
	if (zoneNumber < 0 || zoneNumber > 60) return null;
	var k0 = .9996;
	var a = 6378137;
	var eccSquared = .00669438;
	var eccPrimeSquared;
	var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
	var N1, T1, C1, R1, D, M;
	var LongOrigin;
	var mu, phi1Rad;
	var x = UTMEasting - 5e5;
	var y = UTMNorthing;
	if (zoneLetter < "N") y -= 1e7;
	LongOrigin = (zoneNumber - 1) * 6 - 180 + 3;
	eccPrimeSquared = eccSquared / (1 - eccSquared);
	M = y / k0;
	mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256));
	phi1Rad = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu) + 151 * e1 * e1 * e1 / 96 * Math.sin(6 * mu);
	N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
	T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
	C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
	R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
	D = x / (N1 * k0);
	var lat = phi1Rad - N1 * Math.tan(phi1Rad) / R1 * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D / 720);
	lat = radToDeg(lat);
	var lon = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D / 120) / Math.cos(phi1Rad);
	lon = LongOrigin + radToDeg(lon);
	var result;
	if (utm.accuracy) {
		var topRight = UTMtoLL({
			northing: utm.northing + utm.accuracy,
			easting: utm.easting + utm.accuracy,
			zoneLetter: utm.zoneLetter,
			zoneNumber: utm.zoneNumber
		});
		result = {
			top: topRight.lat,
			right: topRight.lon,
			bottom: lat,
			left: lon
		};
	} else result = {
		lat,
		lon
	};
	return result;
}
/**
* Calculates the MGRS letter designator for the given latitude.
*
* @private
* @param {number} lat The latitude in WGS84 to get the letter designator
*     for.
* @return {char} The letter designator.
*/
function getLetterDesignator(lat) {
	var LetterDesignator = "Z";
	if (84 >= lat && lat >= 72) LetterDesignator = "X";
	else if (72 > lat && lat >= 64) LetterDesignator = "W";
	else if (64 > lat && lat >= 56) LetterDesignator = "V";
	else if (56 > lat && lat >= 48) LetterDesignator = "U";
	else if (48 > lat && lat >= 40) LetterDesignator = "T";
	else if (40 > lat && lat >= 32) LetterDesignator = "S";
	else if (32 > lat && lat >= 24) LetterDesignator = "R";
	else if (24 > lat && lat >= 16) LetterDesignator = "Q";
	else if (16 > lat && lat >= 8) LetterDesignator = "P";
	else if (8 > lat && lat >= 0) LetterDesignator = "N";
	else if (0 > lat && lat >= -8) LetterDesignator = "M";
	else if (-8 > lat && lat >= -16) LetterDesignator = "L";
	else if (-16 > lat && lat >= -24) LetterDesignator = "K";
	else if (-24 > lat && lat >= -32) LetterDesignator = "J";
	else if (-32 > lat && lat >= -40) LetterDesignator = "H";
	else if (-40 > lat && lat >= -48) LetterDesignator = "G";
	else if (-48 > lat && lat >= -56) LetterDesignator = "F";
	else if (-56 > lat && lat >= -64) LetterDesignator = "E";
	else if (-64 > lat && lat >= -72) LetterDesignator = "D";
	else if (-72 > lat && lat >= -80) LetterDesignator = "C";
	return LetterDesignator;
}
/**
* Encodes a UTM location as MGRS string.
*
* @private
* @param {object} utm An object literal with easting, northing,
*     zoneLetter, zoneNumber
* @param {number} accuracy Accuracy in digits (1-5).
* @return {string} MGRS string for the given UTM location.
*/
function encode(utm, accuracy) {
	var seasting = "00000" + utm.easting, snorthing = "00000" + utm.northing;
	return utm.zoneNumber + utm.zoneLetter + get100kID(utm.easting, utm.northing, utm.zoneNumber) + seasting.substr(seasting.length - 5, accuracy) + snorthing.substr(snorthing.length - 5, accuracy);
}
/**
* Get the two letter 100k designator for a given UTM easting,
* northing and zone number value.
*
* @private
* @param {number} easting
* @param {number} northing
* @param {number} zoneNumber
* @return the two letter 100k designator for the given UTM location.
*/
function get100kID(easting, northing, zoneNumber) {
	var setParm = get100kSetForZone(zoneNumber);
	return getLetter100kID(Math.floor(easting / 1e5), Math.floor(northing / 1e5) % 20, setParm);
}
/**
* Given a UTM zone number, figure out the MGRS 100K set it is in.
*
* @private
* @param {number} i An UTM zone number.
* @return {number} the 100k set the UTM zone is in.
*/
function get100kSetForZone(i) {
	var setParm = i % NUM_100K_SETS;
	if (setParm === 0) setParm = NUM_100K_SETS;
	return setParm;
}
/**
* Get the two-letter MGRS 100k designator given information
* translated from the UTM northing, easting and zone number.
*
* @private
* @param {number} column the column index as it relates to the MGRS
*        100k set spreadsheet, created from the UTM easting.
*        Values are 1-8.
* @param {number} row the row index as it relates to the MGRS 100k set
*        spreadsheet, created from the UTM northing value. Values
*        are from 0-19.
* @param {number} parm the set block, as it relates to the MGRS 100k set
*        spreadsheet, created from the UTM zone. Values are from
*        1-60.
* @return two letter MGRS 100k code.
*/
function getLetter100kID(column, row, parm) {
	var index = parm - 1;
	var colOrigin = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(index);
	var rowOrigin = SET_ORIGIN_ROW_LETTERS.charCodeAt(index);
	var colInt = colOrigin + column - 1;
	var rowInt = rowOrigin + row;
	var rollover = false;
	if (colInt > Z) {
		colInt = colInt - Z + A - 1;
		rollover = true;
	}
	if (colInt === I || colOrigin < I && colInt > I || (colInt > I || colOrigin < I) && rollover) colInt++;
	if (colInt === O || colOrigin < O && colInt > O || (colInt > O || colOrigin < O) && rollover) {
		colInt++;
		if (colInt === I) colInt++;
	}
	if (colInt > Z) colInt = colInt - Z + A - 1;
	if (rowInt > V) {
		rowInt = rowInt - V + A - 1;
		rollover = true;
	} else rollover = false;
	if (rowInt === I || rowOrigin < I && rowInt > I || (rowInt > I || rowOrigin < I) && rollover) rowInt++;
	if (rowInt === O || rowOrigin < O && rowInt > O || (rowInt > O || rowOrigin < O) && rollover) {
		rowInt++;
		if (rowInt === I) rowInt++;
	}
	if (rowInt > V) rowInt = rowInt - V + A - 1;
	return String.fromCharCode(colInt) + String.fromCharCode(rowInt);
}
/**
* Decode the UTM parameters from a MGRS string.
*
* @private
* @param {string} mgrsString an UPPERCASE coordinate string is expected.
* @return {object} An object literal with easting, northing, zoneLetter,
*     zoneNumber and accuracy (in meters) properties.
*/
function decode(mgrsString) {
	if (mgrsString && mgrsString.length === 0) throw "MGRSPoint coverting from nothing";
	var length = mgrsString.length;
	var hunK = null;
	var sb = "";
	var testChar;
	var i = 0;
	while (!/[A-Z]/.test(testChar = mgrsString.charAt(i))) {
		if (i >= 2) throw "MGRSPoint bad conversion from: " + mgrsString;
		sb += testChar;
		i++;
	}
	var zoneNumber = parseInt(sb, 10);
	if (i === 0 || i + 3 > length) throw "MGRSPoint bad conversion from: " + mgrsString;
	var zoneLetter = mgrsString.charAt(i++);
	if (zoneLetter <= "A" || zoneLetter === "B" || zoneLetter === "Y" || zoneLetter >= "Z" || zoneLetter === "I" || zoneLetter === "O") throw "MGRSPoint zone letter " + zoneLetter + " not handled: " + mgrsString;
	hunK = mgrsString.substring(i, i += 2);
	var set = get100kSetForZone(zoneNumber);
	var east100k = getEastingFromChar(hunK.charAt(0), set);
	var north100k = getNorthingFromChar(hunK.charAt(1), set);
	while (north100k < getMinNorthing(zoneLetter)) north100k += 2e6;
	var remainder = length - i;
	if (remainder % 2 !== 0) throw "MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters" + mgrsString;
	var sep = remainder / 2;
	var sepEasting = 0;
	var sepNorthing = 0;
	var accuracyBonus, sepEastingString, sepNorthingString, easting, northing;
	if (sep > 0) {
		accuracyBonus = 1e5 / Math.pow(10, sep);
		sepEastingString = mgrsString.substring(i, i + sep);
		sepEasting = parseFloat(sepEastingString) * accuracyBonus;
		sepNorthingString = mgrsString.substring(i + sep);
		sepNorthing = parseFloat(sepNorthingString) * accuracyBonus;
	}
	easting = sepEasting + east100k;
	northing = sepNorthing + north100k;
	return {
		easting,
		northing,
		zoneLetter,
		zoneNumber,
		accuracy: accuracyBonus
	};
}
/**
* Given the first letter from a two-letter MGRS 100k zone, and given the
* MGRS table set for the zone number, figure out the easting value that
* should be added to the other, secondary easting value.
*
* @private
* @param {char} e The first letter from a two-letter MGRS 100´k zone.
* @param {number} set The MGRS table set for the zone number.
* @return {number} The easting value for the given letter and set.
*/
function getEastingFromChar(e, set) {
	var curCol = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(set - 1);
	var eastingValue = 1e5;
	var rewindMarker = false;
	while (curCol !== e.charCodeAt(0)) {
		curCol++;
		if (curCol === I) curCol++;
		if (curCol === O) curCol++;
		if (curCol > Z) {
			if (rewindMarker) throw "Bad character: " + e;
			curCol = A;
			rewindMarker = true;
		}
		eastingValue += 1e5;
	}
	return eastingValue;
}
/**
* Given the second letter from a two-letter MGRS 100k zone, and given the
* MGRS table set for the zone number, figure out the northing value that
* should be added to the other, secondary northing value. You have to
* remember that Northings are determined from the equator, and the vertical
* cycle of letters mean a 2000000 additional northing meters. This happens
* approx. every 18 degrees of latitude. This method does *NOT* count any
* additional northings. You have to figure out how many 2000000 meters need
* to be added for the zone letter of the MGRS coordinate.
*
* @private
* @param {char} n Second letter of the MGRS 100k zone
* @param {number} set The MGRS table set number, which is dependent on the
*     UTM zone number.
* @return {number} The northing value for the given letter and set.
*/
function getNorthingFromChar(n, set) {
	if (n > "V") throw "MGRSPoint given invalid Northing " + n;
	var curRow = SET_ORIGIN_ROW_LETTERS.charCodeAt(set - 1);
	var northingValue = 0;
	var rewindMarker = false;
	while (curRow !== n.charCodeAt(0)) {
		curRow++;
		if (curRow === I) curRow++;
		if (curRow === O) curRow++;
		if (curRow > V) {
			if (rewindMarker) throw "Bad character: " + n;
			curRow = A;
			rewindMarker = true;
		}
		northingValue += 1e5;
	}
	return northingValue;
}
/**
* The function getMinNorthing returns the minimum northing value of a MGRS
* zone.
*
* Ported from Geotrans' c Lattitude_Band_Value structure table.
*
* @private
* @param {char} zoneLetter The MGRS zone to get the min northing for.
* @return {number}
*/
function getMinNorthing(zoneLetter) {
	var northing;
	switch (zoneLetter) {
		case "C":
			northing = 11e5;
			break;
		case "D":
			northing = 2e6;
			break;
		case "E":
			northing = 28e5;
			break;
		case "F":
			northing = 37e5;
			break;
		case "G":
			northing = 46e5;
			break;
		case "H":
			northing = 55e5;
			break;
		case "J":
			northing = 64e5;
			break;
		case "K":
			northing = 73e5;
			break;
		case "L":
			northing = 82e5;
			break;
		case "M":
			northing = 91e5;
			break;
		case "N":
			northing = 0;
			break;
		case "P":
			northing = 8e5;
			break;
		case "Q":
			northing = 17e5;
			break;
		case "R":
			northing = 26e5;
			break;
		case "S":
			northing = 35e5;
			break;
		case "T":
			northing = 44e5;
			break;
		case "U":
			northing = 53e5;
			break;
		case "V":
			northing = 62e5;
			break;
		case "W":
			northing = 7e6;
			break;
		case "X":
			northing = 79e5;
			break;
		default: northing = -1;
	}
	if (northing >= 0) return northing;
	else throw "Invalid zone letter: " + zoneLetter;
}
//#endregion
//#region node_modules/proj4/lib/Point.js
/**
* @deprecated v3.0.0 - use proj4.toPoint instead
* @param {number | import('./core').TemplateCoordinates | string} x
* @param {number} [y]
* @param {number} [z]
*/
function Point(x, y, z) {
	if (!(this instanceof Point)) return new Point(x, y, z);
	if (Array.isArray(x)) {
		this.x = x[0];
		this.y = x[1];
		this.z = x[2] || 0;
	} else if (typeof x === "object") {
		this.x = x.x;
		this.y = x.y;
		this.z = x.z || 0;
	} else if (typeof x === "string" && typeof y === "undefined") {
		var coords = x.split(",");
		this.x = parseFloat(coords[0]);
		this.y = parseFloat(coords[1]);
		this.z = parseFloat(coords[2]) || 0;
	} else {
		this.x = x;
		this.y = y;
		this.z = z || 0;
	}
	console.warn("proj4.Point will be removed in version 3, use proj4.toPoint");
}
Point.fromMGRS = function(mgrsStr) {
	return new Point(toPoint(mgrsStr));
};
Point.prototype.toMGRS = function(accuracy) {
	return forward$32([this.x, this.y], accuracy);
};
//#endregion
//#region node_modules/proj4/lib/common/pj_enfn.js
var C00 = 1;
var C02 = .25;
var C04 = .046875;
var C06 = .01953125;
var C08 = .01068115234375;
var C22 = .75;
var C44 = .46875;
var C46 = .013020833333333334;
var C48 = .007120768229166667;
var C66 = .3645833333333333;
var C68 = .005696614583333333;
var C88 = .3076171875;
function pj_enfn_default(es) {
	var en = [];
	en[0] = C00 - es * (C02 + es * (C04 + es * (C06 + es * C08)));
	en[1] = es * (C22 - es * (C04 + es * (C06 + es * C08)));
	var t = es * es;
	en[2] = t * (C44 - es * (C46 + es * C48));
	t *= es;
	en[3] = t * (C66 - es * C68);
	en[4] = t * es * C88;
	return en;
}
//#endregion
//#region node_modules/proj4/lib/common/pj_mlfn.js
function pj_mlfn_default(phi, sphi, cphi, en) {
	cphi *= sphi;
	sphi *= sphi;
	return en[0] * phi - cphi * (en[1] + sphi * (en[2] + sphi * (en[3] + sphi * en[4])));
}
//#endregion
//#region node_modules/proj4/lib/common/pj_inv_mlfn.js
var MAX_ITER$3 = 20;
function pj_inv_mlfn_default(arg, es, en) {
	var k = 1 / (1 - es);
	var phi = arg;
	for (var i = MAX_ITER$3; i; --i) {
		var s = Math.sin(phi);
		var t = 1 - es * s * s;
		t = (pj_mlfn_default(phi, s, Math.cos(phi), en) - arg) * (t * Math.sqrt(t)) * k;
		phi -= t;
		if (Math.abs(t) < 1e-10) return phi;
	}
	return phi;
}
//#endregion
//#region node_modules/proj4/lib/projections/tmerc.js
/**
* @typedef {Object} LocalThis
* @property {number} es
* @property {Array<number>} en
* @property {number} ml0
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$33() {
	this.x0 = this.x0 !== void 0 ? this.x0 : 0;
	this.y0 = this.y0 !== void 0 ? this.y0 : 0;
	this.long0 = this.long0 !== void 0 ? this.long0 : 0;
	this.lat0 = this.lat0 !== void 0 ? this.lat0 : 0;
	if (this.es) {
		this.en = pj_enfn_default(this.es);
		this.ml0 = pj_mlfn_default(this.lat0, Math.sin(this.lat0), Math.cos(this.lat0), this.en);
	}
}
/**
Transverse Mercator Forward  - long/lat to x/y
long/lat in radians
*/
function forward$31(p) {
	var lon = p.x;
	var lat = p.y;
	var delta_lon = adjust_lon_default(lon - this.long0, this.over);
	var con;
	var x, y;
	var sin_phi = Math.sin(lat);
	var cos_phi = Math.cos(lat);
	if (!this.es) {
		var b = cos_phi * Math.sin(delta_lon);
		if (Math.abs(Math.abs(b) - 1) < 1e-10) return 93;
		else {
			x = .5 * this.a * this.k0 * Math.log((1 + b) / (1 - b)) + this.x0;
			y = cos_phi * Math.cos(delta_lon) / Math.sqrt(1 - Math.pow(b, 2));
			b = Math.abs(y);
			if (b >= 1) if (b - 1 > 1e-10) return 93;
			else y = 0;
			else y = Math.acos(y);
			if (lat < 0) y = -y;
			y = this.a * this.k0 * (y - this.lat0) + this.y0;
		}
	} else {
		var al = cos_phi * delta_lon;
		var als = Math.pow(al, 2);
		var c = this.ep2 * Math.pow(cos_phi, 2);
		var cs = Math.pow(c, 2);
		var t = Math.pow(Math.abs(cos_phi) > 1e-10 ? Math.tan(lat) : 0, 2);
		var ts = Math.pow(t, 2);
		con = 1 - this.es * Math.pow(sin_phi, 2);
		al = al / Math.sqrt(con);
		var ml = pj_mlfn_default(lat, sin_phi, cos_phi, this.en);
		x = this.a * (this.k0 * al * (1 + als / 6 * (1 - t + c + als / 20 * (5 - 18 * t + ts + 14 * c - 58 * t * c + als / 42 * (61 + 179 * ts - ts * t - 479 * t))))) + this.x0;
		y = this.a * (this.k0 * (ml - this.ml0 + sin_phi * delta_lon * al / 2 * (1 + als / 12 * (5 - t + 9 * c + 4 * cs + als / 30 * (61 + ts - 58 * t + 270 * c - 330 * t * c + als / 56 * (1385 + 543 * ts - ts * t - 3111 * t)))))) + this.y0;
	}
	p.x = x;
	p.y = y;
	return p;
}
/**
Transverse Mercator Inverse  -  x/y to long/lat
*/
function inverse$31(p) {
	var con, phi;
	var lat, lon;
	var x = (p.x - this.x0) * (1 / this.a);
	var y = (p.y - this.y0) * (1 / this.a);
	if (!this.es) {
		var f = Math.exp(x / this.k0);
		var g = .5 * (f - 1 / f);
		var temp = this.lat0 + y / this.k0;
		var h = Math.cos(temp);
		con = Math.sqrt((1 - Math.pow(h, 2)) / (1 + Math.pow(g, 2)));
		lat = Math.asin(con);
		if (y < 0) lat = -lat;
		if (g === 0 && h === 0) lon = 0;
		else lon = adjust_lon_default(Math.atan2(g, h) + this.long0, this.over);
	} else {
		con = this.ml0 + y / this.k0;
		phi = pj_inv_mlfn_default(con, this.es, this.en);
		if (Math.abs(phi) < HALF_PI) {
			var sin_phi = Math.sin(phi);
			var cos_phi = Math.cos(phi);
			var tan_phi = Math.abs(cos_phi) > 1e-10 ? Math.tan(phi) : 0;
			var c = this.ep2 * Math.pow(cos_phi, 2);
			var cs = Math.pow(c, 2);
			var t = Math.pow(tan_phi, 2);
			var ts = Math.pow(t, 2);
			con = 1 - this.es * Math.pow(sin_phi, 2);
			var d = x * Math.sqrt(con) / this.k0;
			var ds = Math.pow(d, 2);
			con = con * tan_phi;
			lat = phi - con * ds / (1 - this.es) * .5 * (1 - ds / 12 * (5 + 3 * t - 9 * c * t + c - 4 * cs - ds / 30 * (61 + 90 * t - 252 * c * t + 45 * ts + 46 * c - ds / 56 * (1385 + 3633 * t + 4095 * ts + 1574 * ts * t))));
			lon = adjust_lon_default(this.long0 + d * (1 - ds / 6 * (1 + 2 * t + c - ds / 20 * (5 + 28 * t + 24 * ts + 8 * c * t + 6 * c - ds / 42 * (61 + 662 * t + 1320 * ts + 720 * ts * t)))) / cos_phi, this.over);
		} else {
			lat = HALF_PI * sign_default(y);
			lon = 0;
		}
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var tmerc_default = {
	init: init$33,
	forward: forward$31,
	inverse: inverse$31,
	names: ["Fast_Transverse_Mercator", "Fast Transverse Mercator"]
};
//#endregion
//#region node_modules/proj4/lib/common/sinh.js
function sinh_default(x) {
	var r = Math.exp(x);
	r = (r - 1 / r) / 2;
	return r;
}
//#endregion
//#region node_modules/proj4/lib/common/hypot.js
function hypot_default(x, y) {
	x = Math.abs(x);
	y = Math.abs(y);
	var a = Math.max(x, y);
	var b = Math.min(x, y) / (a ? a : 1);
	return a * Math.sqrt(1 + Math.pow(b, 2));
}
//#endregion
//#region node_modules/proj4/lib/common/log1py.js
function log1py_default(x) {
	var y = 1 + x;
	var z = y - 1;
	return z === 0 ? x : x * Math.log(y) / z;
}
//#endregion
//#region node_modules/proj4/lib/common/asinhy.js
function asinhy_default(x) {
	var y = Math.abs(x);
	y = log1py_default(y * (1 + y / (hypot_default(1, y) + 1)));
	return x < 0 ? -y : y;
}
//#endregion
//#region node_modules/proj4/lib/common/gatg.js
function gatg_default(pp, B) {
	var cos_2B = 2 * Math.cos(2 * B);
	var i = pp.length - 1;
	var h1 = pp[i];
	var h2 = 0;
	var h;
	while (--i >= 0) {
		h = -h2 + cos_2B * h1 + pp[i];
		h2 = h1;
		h1 = h;
	}
	return B + h * Math.sin(2 * B);
}
//#endregion
//#region node_modules/proj4/lib/common/clens.js
function clens_default(pp, arg_r) {
	var r = 2 * Math.cos(arg_r);
	var i = pp.length - 1;
	var hr1 = pp[i];
	var hr2 = 0;
	var hr;
	while (--i >= 0) {
		hr = -hr2 + r * hr1 + pp[i];
		hr2 = hr1;
		hr1 = hr;
	}
	return Math.sin(arg_r) * hr;
}
//#endregion
//#region node_modules/proj4/lib/common/cosh.js
function cosh_default(x) {
	var r = Math.exp(x);
	r = (r + 1 / r) / 2;
	return r;
}
//#endregion
//#region node_modules/proj4/lib/common/clens_cmplx.js
function clens_cmplx_default(pp, arg_r, arg_i) {
	var sin_arg_r = Math.sin(arg_r);
	var cos_arg_r = Math.cos(arg_r);
	var sinh_arg_i = sinh_default(arg_i);
	var cosh_arg_i = cosh_default(arg_i);
	var r = 2 * cos_arg_r * cosh_arg_i;
	var i = -2 * sin_arg_r * sinh_arg_i;
	var j = pp.length - 1;
	var hr = pp[j];
	var hi1 = 0;
	var hr1 = 0;
	var hi = 0;
	var hr2;
	var hi2;
	while (--j >= 0) {
		hr2 = hr1;
		hi2 = hi1;
		hr1 = hr;
		hi1 = hi;
		hr = -hr2 + r * hr1 - i * hi1 + pp[j];
		hi = -hi2 + i * hr1 + r * hi1;
	}
	r = sin_arg_r * cosh_arg_i;
	i = cos_arg_r * sinh_arg_i;
	return [r * hr - i * hi, r * hi + i * hr];
}
//#endregion
//#region node_modules/proj4/lib/projections/etmerc.js
/**
* @typedef {Object} LocalThis
* @property {number} es
* @property {Array<number>} cbg
* @property {Array<number>} cgb
* @property {Array<number>} utg
* @property {Array<number>} gtu
* @property {number} Qn
* @property {number} Zb
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$32() {
	if (!this.approx && (isNaN(this.es) || this.es <= 0)) throw new Error("Incorrect elliptical usage. Try using the +approx option in the proj string, or PROJECTION[\"Fast_Transverse_Mercator\"] in the WKT.");
	if (this.approx) {
		tmerc_default.init.apply(this);
		this.forward = tmerc_default.forward;
		this.inverse = tmerc_default.inverse;
	}
	this.x0 = this.x0 !== void 0 ? this.x0 : 0;
	this.y0 = this.y0 !== void 0 ? this.y0 : 0;
	this.long0 = this.long0 !== void 0 ? this.long0 : 0;
	this.lat0 = this.lat0 !== void 0 ? this.lat0 : 0;
	this.k0 = this.k0 !== void 0 ? this.k0 : 1;
	this.cgb = [];
	this.cbg = [];
	this.utg = [];
	this.gtu = [];
	var f = this.es / (1 + Math.sqrt(1 - this.es));
	var n = f / (2 - f);
	var np = n;
	this.cgb[0] = n * (2 + n * (-2 / 3 + n * (-2 + n * (116 / 45 + n * (26 / 45 + n * (-2854 / 675))))));
	this.cbg[0] = n * (-2 + n * (2 / 3 + n * (4 / 3 + n * (-82 / 45 + n * (32 / 45 + n * (4642 / 4725))))));
	np = np * n;
	this.cgb[1] = np * (7 / 3 + n * (-8 / 5 + n * (-227 / 45 + n * (2704 / 315 + n * (2323 / 945)))));
	this.cbg[1] = np * (5 / 3 + n * (-16 / 15 + n * (-13 / 9 + n * (904 / 315 + n * (-1522 / 945)))));
	np = np * n;
	this.cgb[2] = np * (56 / 15 + n * (-136 / 35 + n * (-1262 / 105 + n * (73814 / 2835))));
	this.cbg[2] = np * (-26 / 15 + n * (34 / 21 + n * (8 / 5 + n * (-12686 / 2835))));
	np = np * n;
	this.cgb[3] = np * (4279 / 630 + n * (-332 / 35 + n * (-399572 / 14175)));
	this.cbg[3] = np * (1237 / 630 + n * (-12 / 5 + n * (-24832 / 14175)));
	np = np * n;
	this.cgb[4] = np * (4174 / 315 + n * (-144838 / 6237));
	this.cbg[4] = np * (-734 / 315 + n * (109598 / 31185));
	np = np * n;
	this.cgb[5] = np * (601676 / 22275);
	this.cbg[5] = np * (444337 / 155925);
	np = Math.pow(n, 2);
	this.Qn = this.k0 / (1 + n) * (1 + np * (1 / 4 + np * (1 / 64 + np / 256)));
	this.utg[0] = n * (-.5 + n * (2 / 3 + n * (-37 / 96 + n * (1 / 360 + n * (81 / 512 + n * (-96199 / 604800))))));
	this.gtu[0] = n * (.5 + n * (-2 / 3 + n * (5 / 16 + n * (41 / 180 + n * (-127 / 288 + n * (7891 / 37800))))));
	this.utg[1] = np * (-1 / 48 + n * (-1 / 15 + n * (437 / 1440 + n * (-46 / 105 + n * (1118711 / 3870720)))));
	this.gtu[1] = np * (13 / 48 + n * (-3 / 5 + n * (557 / 1440 + n * (281 / 630 + n * (-1983433 / 1935360)))));
	np = np * n;
	this.utg[2] = np * (-17 / 480 + n * (37 / 840 + n * (209 / 4480 + n * (-5569 / 90720))));
	this.gtu[2] = np * (61 / 240 + n * (-103 / 140 + n * (15061 / 26880 + n * (167603 / 181440))));
	np = np * n;
	this.utg[3] = np * (-4397 / 161280 + n * (11 / 504 + n * (830251 / 7257600)));
	this.gtu[3] = np * (49561 / 161280 + n * (-179 / 168 + n * (6601661 / 7257600)));
	np = np * n;
	this.utg[4] = np * (-4583 / 161280 + n * (108847 / 3991680));
	this.gtu[4] = np * (34729 / 80640 + n * (-3418889 / 1995840));
	np = np * n;
	this.utg[5] = np * (-20648693 / 638668800);
	this.gtu[5] = np * (212378941 / 319334400);
	var Z = gatg_default(this.cbg, this.lat0);
	this.Zb = -this.Qn * (Z + clens_default(this.gtu, 2 * Z));
}
function forward$30(p) {
	var Ce = adjust_lon_default(p.x - this.long0, this.over);
	var Cn = p.y;
	Cn = gatg_default(this.cbg, Cn);
	var sin_Cn = Math.sin(Cn);
	var cos_Cn = Math.cos(Cn);
	var sin_Ce = Math.sin(Ce);
	var cos_Ce = Math.cos(Ce);
	Cn = Math.atan2(sin_Cn, cos_Ce * cos_Cn);
	Ce = Math.atan2(sin_Ce * cos_Cn, hypot_default(sin_Cn, cos_Cn * cos_Ce));
	Ce = asinhy_default(Math.tan(Ce));
	var tmp = clens_cmplx_default(this.gtu, 2 * Cn, 2 * Ce);
	Cn = Cn + tmp[0];
	Ce = Ce + tmp[1];
	var x;
	var y;
	if (Math.abs(Ce) <= 2.623395162778) {
		x = this.a * (this.Qn * Ce) + this.x0;
		y = this.a * (this.Qn * Cn + this.Zb) + this.y0;
	} else {
		x = Infinity;
		y = Infinity;
	}
	p.x = x;
	p.y = y;
	return p;
}
function inverse$30(p) {
	var Ce = (p.x - this.x0) * (1 / this.a);
	var Cn = (p.y - this.y0) * (1 / this.a);
	Cn = (Cn - this.Zb) / this.Qn;
	Ce = Ce / this.Qn;
	var lon;
	var lat;
	if (Math.abs(Ce) <= 2.623395162778) {
		var tmp = clens_cmplx_default(this.utg, 2 * Cn, 2 * Ce);
		Cn = Cn + tmp[0];
		Ce = Ce + tmp[1];
		Ce = Math.atan(sinh_default(Ce));
		var sin_Cn = Math.sin(Cn);
		var cos_Cn = Math.cos(Cn);
		var sin_Ce = Math.sin(Ce);
		var cos_Ce = Math.cos(Ce);
		Cn = Math.atan2(sin_Cn * cos_Ce, hypot_default(sin_Ce, cos_Ce * cos_Cn));
		Ce = Math.atan2(sin_Ce, cos_Ce * cos_Cn);
		lon = adjust_lon_default(Ce + this.long0, this.over);
		lat = gatg_default(this.cgb, Cn);
	} else {
		lon = Infinity;
		lat = Infinity;
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var etmerc_default = {
	init: init$32,
	forward: forward$30,
	inverse: inverse$30,
	names: [
		"Extended_Transverse_Mercator",
		"Extended Transverse Mercator",
		"etmerc",
		"Transverse_Mercator",
		"Transverse Mercator",
		"Gauss Kruger",
		"Gauss_Kruger",
		"tmerc"
	]
};
//#endregion
//#region node_modules/proj4/lib/common/adjust_zone.js
function adjust_zone_default(zone, lon) {
	if (zone === void 0) {
		zone = Math.floor((adjust_lon_default(lon) + Math.PI) * 30 / Math.PI) + 1;
		if (zone < 0) return 0;
		else if (zone > 60) return 60;
	}
	return zone;
}
//#endregion
//#region node_modules/proj4/lib/projections/utm.js
var dependsOn = "etmerc";
/** @this {import('../defs.js').ProjectionDefinition} */
function init$31() {
	var zone = adjust_zone_default(this.zone, this.long0);
	if (zone === void 0) throw new Error("unknown utm zone");
	this.lat0 = 0;
	this.long0 = (6 * Math.abs(zone) - 183) * D2R$1;
	this.x0 = 5e5;
	this.y0 = this.utmSouth ? 1e7 : 0;
	this.k0 = .9996;
	etmerc_default.init.apply(this);
	this.forward = etmerc_default.forward;
	this.inverse = etmerc_default.inverse;
}
var utm_default = {
	init: init$31,
	names: ["Universal Transverse Mercator System", "utm"],
	dependsOn
};
//#endregion
//#region node_modules/proj4/lib/common/srat.js
function srat_default(esinp, exp) {
	return Math.pow((1 - esinp) / (1 + esinp), exp);
}
//#endregion
//#region node_modules/proj4/lib/projections/gauss.js
var MAX_ITER$2 = 20;
/**
* @typedef {Object} LocalThis
* @property {number} rc
* @property {number} C
* @property {number} phic0
* @property {number} ratexp
* @property {number} K
* @property {number} e
* @property {number} es
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$30() {
	var sphi = Math.sin(this.lat0);
	var cphi = Math.cos(this.lat0);
	cphi *= cphi;
	this.rc = Math.sqrt(1 - this.es) / (1 - this.es * sphi * sphi);
	this.C = Math.sqrt(1 + this.es * cphi * cphi / (1 - this.es));
	this.phic0 = Math.asin(sphi / this.C);
	this.ratexp = .5 * this.C * this.e;
	this.K = Math.tan(.5 * this.phic0 + FORTPI) / (Math.pow(Math.tan(.5 * this.lat0 + FORTPI), this.C) * srat_default(this.e * sphi, this.ratexp));
}
function forward$29(p) {
	var lon = p.x;
	var lat = p.y;
	p.y = 2 * Math.atan(this.K * Math.pow(Math.tan(.5 * lat + FORTPI), this.C) * srat_default(this.e * Math.sin(lat), this.ratexp)) - HALF_PI;
	p.x = this.C * lon;
	return p;
}
function inverse$29(p) {
	var DEL_TOL = 1e-14;
	var lon = p.x / this.C;
	var lat = p.y;
	var num = Math.pow(Math.tan(.5 * lat + FORTPI) / this.K, 1 / this.C);
	for (var i = MAX_ITER$2; i > 0; --i) {
		lat = 2 * Math.atan(num * srat_default(this.e * Math.sin(p.y), -.5 * this.e)) - HALF_PI;
		if (Math.abs(lat - p.y) < DEL_TOL) break;
		p.y = lat;
	}
	if (!i) return null;
	p.x = lon;
	p.y = lat;
	return p;
}
var gauss_default = {
	init: init$30,
	forward: forward$29,
	inverse: inverse$29,
	names: ["gauss"]
};
//#endregion
//#region node_modules/proj4/lib/projections/sterea.js
/**
* @typedef {Object} LocalThis
* @property {number} sinc0
* @property {number} cosc0
* @property {number} R2
* @property {number} rc
* @property {number} phic0
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$29() {
	gauss_default.init.apply(this);
	if (!this.rc) return;
	this.sinc0 = Math.sin(this.phic0);
	this.cosc0 = Math.cos(this.phic0);
	this.R2 = 2 * this.rc;
	if (!this.title) this.title = "Oblique Stereographic Alternative";
}
function forward$28(p) {
	var sinc, cosc, cosl, k;
	p.x = adjust_lon_default(p.x - this.long0, this.over);
	gauss_default.forward.apply(this, [p]);
	sinc = Math.sin(p.y);
	cosc = Math.cos(p.y);
	cosl = Math.cos(p.x);
	k = this.k0 * this.R2 / (1 + this.sinc0 * sinc + this.cosc0 * cosc * cosl);
	p.x = k * cosc * Math.sin(p.x);
	p.y = k * (this.cosc0 * sinc - this.sinc0 * cosc * cosl);
	p.x = this.a * p.x + this.x0;
	p.y = this.a * p.y + this.y0;
	return p;
}
function inverse$28(p) {
	var sinc, cosc, lon, lat, rho;
	p.x = (p.x - this.x0) / this.a;
	p.y = (p.y - this.y0) / this.a;
	p.x /= this.k0;
	p.y /= this.k0;
	if (rho = hypot_default(p.x, p.y)) {
		var c = 2 * Math.atan2(rho, this.R2);
		sinc = Math.sin(c);
		cosc = Math.cos(c);
		lat = Math.asin(cosc * this.sinc0 + p.y * sinc * this.cosc0 / rho);
		lon = Math.atan2(p.x * sinc, rho * this.cosc0 * cosc - p.y * this.sinc0 * sinc);
	} else {
		lat = this.phic0;
		lon = 0;
	}
	p.x = lon;
	p.y = lat;
	gauss_default.inverse.apply(this, [p]);
	p.x = adjust_lon_default(p.x + this.long0, this.over);
	return p;
}
var sterea_default = {
	init: init$29,
	forward: forward$28,
	inverse: inverse$28,
	names: [
		"Stereographic_North_Pole",
		"Oblique_Stereographic",
		"sterea",
		"Oblique Stereographic Alternative",
		"Double_Stereographic"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/stere.js
/**
* @typedef {Object} LocalThis
* @property {number} coslat0
* @property {number} sinlat0
* @property {number} ms1
* @property {number} X0
* @property {number} cosX0
* @property {number} sinX0
* @property {number} con
* @property {number} cons
* @property {number} e
*/
function ssfn_(phit, sinphi, eccen) {
	sinphi *= eccen;
	return Math.tan(.5 * (HALF_PI + phit)) * Math.pow((1 - sinphi) / (1 + sinphi), .5 * eccen);
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$28() {
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.lat0 = this.lat0 || 0;
	this.long0 = this.long0 || 0;
	this.coslat0 = Math.cos(this.lat0);
	this.sinlat0 = Math.sin(this.lat0);
	if (this.sphere) {
		if (!isNaN(this.lat_ts) && Math.abs(this.coslat0) <= 1e-10) this.k0 = .5 * (1 + sign_default(this.lat0) * Math.sin(this.lat_ts));
	} else {
		if (Math.abs(this.coslat0) <= 1e-10) if (this.lat0 > 0) this.con = 1;
		else this.con = -1;
		this.cons = Math.sqrt(Math.pow(1 + this.e, 1 + this.e) * Math.pow(1 - this.e, 1 - this.e));
		if (!isNaN(this.lat_ts) && Math.abs(this.coslat0) <= 1e-10 && Math.abs(Math.cos(this.lat_ts)) > 1e-10) this.k0 = .5 * this.cons * msfnz_default(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts)) / tsfnz_default(this.e, this.con * this.lat_ts, this.con * Math.sin(this.lat_ts));
		this.ms1 = msfnz_default(this.e, this.sinlat0, this.coslat0);
		this.X0 = 2 * Math.atan(ssfn_(this.lat0, this.sinlat0, this.e)) - HALF_PI;
		this.cosX0 = Math.cos(this.X0);
		this.sinX0 = Math.sin(this.X0);
	}
}
function forward$27(p) {
	var lon = p.x;
	var lat = p.y;
	var sinlat = Math.sin(lat);
	var coslat = Math.cos(lat);
	var A, X, sinX, cosX, ts, rh;
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	if (Math.abs(Math.abs(lon - this.long0) - Math.PI) <= 1e-10 && Math.abs(lat + this.lat0) <= 1e-10) {
		p.x = NaN;
		p.y = NaN;
		return p;
	}
	if (this.sphere) {
		A = 2 * this.k0 / (1 + this.sinlat0 * sinlat + this.coslat0 * coslat * Math.cos(dlon));
		p.x = this.a * A * coslat * Math.sin(dlon) + this.x0;
		p.y = this.a * A * (this.coslat0 * sinlat - this.sinlat0 * coslat * Math.cos(dlon)) + this.y0;
		return p;
	} else {
		X = 2 * Math.atan(ssfn_(lat, sinlat, this.e)) - HALF_PI;
		cosX = Math.cos(X);
		sinX = Math.sin(X);
		if (Math.abs(this.coslat0) <= 1e-10) {
			ts = tsfnz_default(this.e, lat * this.con, this.con * sinlat);
			rh = 2 * this.a * this.k0 * ts / this.cons;
			p.x = this.x0 + rh * Math.sin(lon - this.long0);
			p.y = this.y0 - this.con * rh * Math.cos(lon - this.long0);
			return p;
		} else if (Math.abs(this.sinlat0) < 1e-10) {
			A = 2 * this.a * this.k0 / (1 + cosX * Math.cos(dlon));
			p.y = A * sinX;
		} else {
			A = 2 * this.a * this.k0 * this.ms1 / (this.cosX0 * (1 + this.sinX0 * sinX + this.cosX0 * cosX * Math.cos(dlon)));
			p.y = A * (this.cosX0 * sinX - this.sinX0 * cosX * Math.cos(dlon)) + this.y0;
		}
		p.x = A * cosX * Math.sin(dlon) + this.x0;
	}
	return p;
}
function inverse$27(p) {
	p.x -= this.x0;
	p.y -= this.y0;
	var lon, lat, ts, ce, Chi;
	var rh = Math.sqrt(p.x * p.x + p.y * p.y);
	if (this.sphere) {
		var c = 2 * Math.atan(rh / (2 * this.a * this.k0));
		lon = this.long0;
		lat = this.lat0;
		if (rh <= 1e-10) {
			p.x = lon;
			p.y = lat;
			return p;
		}
		lat = Math.asin(Math.cos(c) * this.sinlat0 + p.y * Math.sin(c) * this.coslat0 / rh);
		if (Math.abs(this.coslat0) < 1e-10) if (this.lat0 > 0) lon = adjust_lon_default(this.long0 + Math.atan2(p.x, -1 * p.y), this.over);
		else lon = adjust_lon_default(this.long0 + Math.atan2(p.x, p.y), this.over);
		else lon = adjust_lon_default(this.long0 + Math.atan2(p.x * Math.sin(c), rh * this.coslat0 * Math.cos(c) - p.y * this.sinlat0 * Math.sin(c)), this.over);
		p.x = lon;
		p.y = lat;
		return p;
	} else if (Math.abs(this.coslat0) <= 1e-10) {
		if (rh <= 1e-10) {
			lat = this.lat0;
			lon = this.long0;
			p.x = lon;
			p.y = lat;
			return p;
		}
		p.x *= this.con;
		p.y *= this.con;
		ts = rh * this.cons / (2 * this.a * this.k0);
		lat = this.con * phi2z_default(this.e, ts);
		lon = this.con * adjust_lon_default(this.con * this.long0 + Math.atan2(p.x, -1 * p.y), this.over);
	} else {
		ce = 2 * Math.atan(rh * this.cosX0 / (2 * this.a * this.k0 * this.ms1));
		lon = this.long0;
		if (rh <= 1e-10) Chi = this.X0;
		else {
			Chi = Math.asin(Math.cos(ce) * this.sinX0 + p.y * Math.sin(ce) * this.cosX0 / rh);
			lon = adjust_lon_default(this.long0 + Math.atan2(p.x * Math.sin(ce), rh * this.cosX0 * Math.cos(ce) - p.y * this.sinX0 * Math.sin(ce)), this.over);
		}
		lat = -1 * phi2z_default(this.e, Math.tan(.5 * (HALF_PI + Chi)));
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var stere_default = {
	init: init$28,
	forward: forward$27,
	inverse: inverse$27,
	names: [
		"stere",
		"Stereographic_South_Pole",
		"Polar_Stereographic_variant_A",
		"Polar_Stereographic_variant_B",
		"Polar_Stereographic"
	],
	ssfn_
};
//#endregion
//#region node_modules/proj4/lib/projections/somerc.js
/**
* @typedef {Object} LocalThis
* @property {number} lambda0
* @property {number} e
* @property {number} R
* @property {number} b0
* @property {number} K
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$27() {
	if (!this.k0) this.k0 = 1;
	var phy0 = this.lat0;
	this.lambda0 = this.long0;
	var sinPhy0 = Math.sin(phy0);
	var semiMajorAxis = this.a;
	var flattening = 1 / this.rf;
	var e2 = 2 * flattening - Math.pow(flattening, 2);
	var e = this.e = Math.sqrt(e2);
	this.R = this.k0 * semiMajorAxis * Math.sqrt(1 - e2) / (1 - e2 * Math.pow(sinPhy0, 2));
	this.alpha = Math.sqrt(1 + e2 / (1 - e2) * Math.pow(Math.cos(phy0), 4));
	this.b0 = Math.asin(sinPhy0 / this.alpha);
	var k1 = Math.log(Math.tan(Math.PI / 4 + this.b0 / 2));
	var k2 = Math.log(Math.tan(Math.PI / 4 + phy0 / 2));
	var k3 = Math.log((1 + e * sinPhy0) / (1 - e * sinPhy0));
	this.K = k1 - this.alpha * k2 + this.alpha * e / 2 * k3;
}
function forward$26(p) {
	var Sa1 = Math.log(Math.tan(Math.PI / 4 - p.y / 2));
	var Sa2 = this.e / 2 * Math.log((1 + this.e * Math.sin(p.y)) / (1 - this.e * Math.sin(p.y)));
	var S = -this.alpha * (Sa1 + Sa2) + this.K;
	var b = 2 * (Math.atan(Math.exp(S)) - Math.PI / 4);
	var I = this.alpha * (p.x - this.lambda0);
	var rotI = Math.atan(Math.sin(I) / (Math.sin(this.b0) * Math.tan(b) + Math.cos(this.b0) * Math.cos(I)));
	var rotB = Math.asin(Math.cos(this.b0) * Math.sin(b) - Math.sin(this.b0) * Math.cos(b) * Math.cos(I));
	p.y = this.R / 2 * Math.log((1 + Math.sin(rotB)) / (1 - Math.sin(rotB))) + this.y0;
	p.x = this.R * rotI + this.x0;
	return p;
}
function inverse$26(p) {
	var Y = p.x - this.x0;
	var X = p.y - this.y0;
	var rotI = Y / this.R;
	var rotB = 2 * (Math.atan(Math.exp(X / this.R)) - Math.PI / 4);
	var b = Math.asin(Math.cos(this.b0) * Math.sin(rotB) + Math.sin(this.b0) * Math.cos(rotB) * Math.cos(rotI));
	var I = Math.atan(Math.sin(rotI) / (Math.cos(this.b0) * Math.cos(rotI) - Math.sin(this.b0) * Math.tan(rotB)));
	var lambda = this.lambda0 + I / this.alpha;
	var S = 0;
	var phy = b;
	var prevPhy = -1e3;
	var iteration = 0;
	while (Math.abs(phy - prevPhy) > 1e-7) {
		if (++iteration > 20) return;
		S = 1 / this.alpha * (Math.log(Math.tan(Math.PI / 4 + b / 2)) - this.K) + this.e * Math.log(Math.tan(Math.PI / 4 + Math.asin(this.e * Math.sin(phy)) / 2));
		prevPhy = phy;
		phy = 2 * Math.atan(Math.exp(S)) - Math.PI / 2;
	}
	p.x = lambda;
	p.y = phy;
	return p;
}
var somerc_default = {
	init: init$27,
	forward: forward$26,
	inverse: inverse$26,
	names: ["somerc"]
};
//#endregion
//#region node_modules/proj4/lib/projections/omerc.js
/**
* @typedef {Object} LocalThis
* @property {boolean} no_off
* @property {boolean} no_rot
* @property {number} rectified_grid_angle
* @property {number} es
* @property {number} A
* @property {number} B
* @property {number} E
* @property {number} e
* @property {number} lam0
* @property {number} singam
* @property {number} cosgam
* @property {number} sinrot
* @property {number} cosrot
* @property {number} rB
* @property {number} ArB
* @property {number} BrA
* @property {number} u_0
* @property {number} v_pole_n
* @property {number} v_pole_s
*/
var TOL = 1e-7;
function isTypeA(P) {
	var typeAProjections = [
		"Hotine_Oblique_Mercator",
		"Hotine_Oblique_Mercator_variant_A",
		"Hotine_Oblique_Mercator_Azimuth_Natural_Origin"
	];
	var projectionName = typeof P.projName === "object" ? Object.keys(P.projName)[0] : P.projName;
	return "no_uoff" in P || "no_off" in P || typeAProjections.indexOf(projectionName) !== -1 || typeAProjections.indexOf(getNormalizedProjName(projectionName)) !== -1;
}
/**
* Initialize the Oblique Mercator  projection
* @this {import('../defs.js').ProjectionDefinition & LocalThis}
*/
function init$26() {
	var con, com, cosph0, D, F, H, L, sinph0, p, J, gamma = 0, gamma0, lamc = 0, lam1 = 0, lam2 = 0, phi1 = 0, phi2 = 0, alpha_c = 0;
	if (!this.k0) this.k0 = 1;
	this.no_off = isTypeA(this);
	this.no_rot = "no_rot" in this;
	var alp = false;
	if ("alpha" in this) alp = true;
	var gam = false;
	if ("rectified_grid_angle" in this) gam = true;
	if (alp) alpha_c = this.alpha;
	if (gam) {
		gamma = this.rectified_grid_angle;
		if (!alp) {
			alpha_c = 0;
			alp = true;
		}
	}
	if (alp || gam) lamc = this.longc;
	else {
		lam1 = this.long1;
		phi1 = this.lat1;
		lam2 = this.long2;
		phi2 = this.lat2;
		if (Math.abs(phi1 - phi2) <= TOL || (con = Math.abs(phi1)) <= TOL || Math.abs(con - HALF_PI) <= TOL || Math.abs(Math.abs(this.lat0) - HALF_PI) <= TOL || Math.abs(Math.abs(phi2) - HALF_PI) <= TOL) throw new Error();
	}
	var one_es = 1 - this.es;
	com = Math.sqrt(one_es);
	if (Math.abs(this.lat0) > 1e-10) {
		sinph0 = Math.sin(this.lat0);
		cosph0 = Math.cos(this.lat0);
		con = 1 - this.es * sinph0 * sinph0;
		this.B = cosph0 * cosph0;
		this.B = Math.sqrt(1 + this.es * this.B * this.B / one_es);
		this.A = this.B * this.k0 * com / con;
		D = this.B * com / (cosph0 * Math.sqrt(con));
		F = D * D - 1;
		if (F <= 0) F = 0;
		else {
			F = Math.sqrt(F);
			if (this.lat0 < 0) F = -F;
		}
		this.E = F += D;
		this.E *= Math.pow(tsfnz_default(this.e, this.lat0, sinph0), this.B);
	} else {
		this.B = 1 / com;
		this.A = this.k0;
		this.E = D = F = 1;
	}
	if (alp || gam) {
		if (alp) {
			gamma0 = Math.asin(Math.sin(alpha_c) / D);
			if (!gam) gamma = alpha_c;
		} else {
			gamma0 = gamma;
			alpha_c = Math.asin(D * Math.sin(gamma0));
		}
		this.lam0 = lamc - Math.asin(.5 * (F - 1 / F) * Math.tan(gamma0)) / this.B;
	} else {
		H = Math.pow(tsfnz_default(this.e, phi1, Math.sin(phi1)), this.B);
		L = Math.pow(tsfnz_default(this.e, phi2, Math.sin(phi2)), this.B);
		F = this.E / H;
		p = (L - H) / (L + H);
		J = this.E * this.E;
		J = (J - L * H) / (J + L * H);
		con = lam1 - lam2;
		if (con < -Math.PI) lam2 -= TWO_PI;
		else if (con > Math.PI) lam2 += TWO_PI;
		this.lam0 = adjust_lon_default(.5 * (lam1 + lam2) - Math.atan(J * Math.tan(.5 * this.B * (lam1 - lam2)) / p) / this.B, this.over);
		gamma0 = Math.atan(2 * Math.sin(this.B * adjust_lon_default(lam1 - this.lam0, this.over)) / (F - 1 / F));
		gamma = alpha_c = Math.asin(D * Math.sin(gamma0));
	}
	this.singam = Math.sin(gamma0);
	this.cosgam = Math.cos(gamma0);
	this.sinrot = Math.sin(gamma);
	this.cosrot = Math.cos(gamma);
	this.rB = 1 / this.B;
	this.ArB = this.A * this.rB;
	this.BrA = 1 / this.ArB;
	if (this.no_off) this.u_0 = 0;
	else {
		this.u_0 = Math.abs(this.ArB * Math.atan(Math.sqrt(D * D - 1) / Math.cos(alpha_c)));
		if (this.lat0 < 0) this.u_0 = -this.u_0;
	}
	F = .5 * gamma0;
	this.v_pole_n = this.ArB * Math.log(Math.tan(FORTPI - F));
	this.v_pole_s = this.ArB * Math.log(Math.tan(FORTPI + F));
}
function forward$25(p) {
	var coords = {};
	var S, T, U, V, W, temp, u, v;
	p.x = p.x - this.lam0;
	if (Math.abs(Math.abs(p.y) - HALF_PI) > 1e-10) {
		W = this.E / Math.pow(tsfnz_default(this.e, p.y, Math.sin(p.y)), this.B);
		temp = 1 / W;
		S = .5 * (W - temp);
		T = .5 * (W + temp);
		V = Math.sin(this.B * p.x);
		U = (S * this.singam - V * this.cosgam) / T;
		if (Math.abs(Math.abs(U) - 1) < 1e-10) throw new Error();
		v = .5 * this.ArB * Math.log((1 - U) / (1 + U));
		temp = Math.cos(this.B * p.x);
		if (Math.abs(temp) < TOL) u = this.A * p.x;
		else u = this.ArB * Math.atan2(S * this.cosgam + V * this.singam, temp);
	} else {
		v = p.y > 0 ? this.v_pole_n : this.v_pole_s;
		u = this.ArB * p.y;
	}
	if (this.no_rot) {
		coords.x = u;
		coords.y = v;
	} else {
		u -= this.u_0;
		coords.x = v * this.cosrot + u * this.sinrot;
		coords.y = u * this.cosrot - v * this.sinrot;
	}
	coords.x = this.a * coords.x + this.x0;
	coords.y = this.a * coords.y + this.y0;
	if (p.z !== void 0) coords.z = p.z;
	if (p.m !== void 0) coords.m = p.m;
	return coords;
}
function inverse$25(p) {
	var u, v, Qp, Sp, Tp, Vp, Up;
	var coords = {};
	p.x = (p.x - this.x0) * (1 / this.a);
	p.y = (p.y - this.y0) * (1 / this.a);
	if (this.no_rot) {
		v = p.y;
		u = p.x;
	} else {
		v = p.x * this.cosrot - p.y * this.sinrot;
		u = p.y * this.cosrot + p.x * this.sinrot + this.u_0;
	}
	Qp = Math.exp(-this.BrA * v);
	Sp = .5 * (Qp - 1 / Qp);
	Tp = .5 * (Qp + 1 / Qp);
	Vp = Math.sin(this.BrA * u);
	Up = (Vp * this.cosgam + Sp * this.singam) / Tp;
	if (Math.abs(Math.abs(Up) - 1) < 1e-10) {
		coords.x = 0;
		coords.y = Up < 0 ? -HALF_PI : HALF_PI;
	} else {
		coords.y = this.E / Math.sqrt((1 + Up) / (1 - Up));
		coords.y = phi2z_default(this.e, Math.pow(coords.y, 1 / this.B));
		if (coords.y === Infinity) throw new Error();
		coords.x = -this.rB * Math.atan2(Sp * this.cosgam - Vp * this.singam, Math.cos(this.BrA * u));
	}
	coords.x += this.lam0;
	if (p.z !== void 0) coords.z = p.z;
	if (p.m !== void 0) coords.m = p.m;
	return coords;
}
var omerc_default = {
	init: init$26,
	forward: forward$25,
	inverse: inverse$25,
	names: [
		"Hotine_Oblique_Mercator",
		"Hotine Oblique Mercator",
		"Hotine_Oblique_Mercator_variant_A",
		"Hotine_Oblique_Mercator_Variant_B",
		"Hotine_Oblique_Mercator_Azimuth_Natural_Origin",
		"Hotine_Oblique_Mercator_Two_Point_Natural_Origin",
		"Hotine_Oblique_Mercator_Azimuth_Center",
		"Oblique_Mercator",
		"omerc"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/lcc.js
/**
* @typedef {Object} LocalThis
* @property {number} e
* @property {number} ns
* @property {number} f0
* @property {number} rh
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$25() {
	if (!this.lat2) this.lat2 = this.lat1;
	if (!this.k0) this.k0 = 1;
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.long0 = this.long0 || 0;
	if (Math.abs(this.lat1 + this.lat2) < 1e-10) return;
	var temp = this.b / this.a;
	this.e = Math.sqrt(1 - temp * temp);
	var sin1 = Math.sin(this.lat1);
	var cos1 = Math.cos(this.lat1);
	var ms1 = msfnz_default(this.e, sin1, cos1);
	var ts1 = tsfnz_default(this.e, this.lat1, sin1);
	var sin2 = Math.sin(this.lat2);
	var cos2 = Math.cos(this.lat2);
	var ms2 = msfnz_default(this.e, sin2, cos2);
	var ts2 = tsfnz_default(this.e, this.lat2, sin2);
	var ts0 = tsfnz_default(this.e, this.lat0, Math.sin(this.lat0));
	if (Math.abs(this.lat1 - this.lat2) > 1e-10) this.ns = Math.log(ms1 / ms2) / Math.log(ts1 / ts2);
	else this.ns = sin1;
	if (isNaN(this.ns)) this.ns = sin1;
	this.f0 = ms1 / (this.ns * Math.pow(ts1, this.ns));
	this.rh = Math.abs(Math.abs(this.lat0) - HALF_PI) < 1e-10 ? 0 : this.a * this.f0 * Math.pow(ts0, this.ns);
	if (!this.title) this.title = "Lambert Conformal Conic";
}
function forward$24(p) {
	var lon = p.x;
	var lat = p.y;
	if (Math.abs(2 * Math.abs(lat) - Math.PI) <= 1e-10) lat = sign_default(lat) * (HALF_PI - 2 * EPSLN);
	var con = Math.abs(Math.abs(lat) - HALF_PI);
	var ts, rh1;
	if (con > 1e-10) {
		ts = tsfnz_default(this.e, lat, Math.sin(lat));
		rh1 = this.a * this.f0 * Math.pow(ts, this.ns);
	} else {
		con = lat * this.ns;
		if (con <= 0) return null;
		rh1 = 0;
	}
	var theta = this.ns * adjust_lon_default(lon - this.long0, this.over);
	p.x = this.k0 * (rh1 * Math.sin(theta)) + this.x0;
	p.y = this.k0 * (this.rh - rh1 * Math.cos(theta)) + this.y0;
	return p;
}
function inverse$24(p) {
	var rh1, con, ts;
	var lat, lon;
	var x = (p.x - this.x0) / this.k0;
	var y = this.rh - (p.y - this.y0) / this.k0;
	if (this.ns > 0) {
		rh1 = Math.sqrt(x * x + y * y);
		con = 1;
	} else {
		rh1 = -Math.sqrt(x * x + y * y);
		con = -1;
	}
	var theta = 0;
	if (rh1 !== 0) theta = Math.atan2(con * x, con * y);
	if (rh1 !== 0 || this.ns > 0) {
		con = 1 / this.ns;
		ts = Math.pow(rh1 / (this.a * this.f0), con);
		lat = phi2z_default(this.e, ts);
		if (lat === -9999) return null;
	} else lat = -HALF_PI;
	lon = adjust_lon_default(theta / this.ns + this.long0, this.over);
	p.x = lon;
	p.y = lat;
	return p;
}
var lcc_default = {
	init: init$25,
	forward: forward$24,
	inverse: inverse$24,
	names: [
		"Lambert Tangential Conformal Conic Projection",
		"Lambert_Conformal_Conic",
		"Lambert_Conformal_Conic_1SP",
		"Lambert_Conformal_Conic_2SP",
		"lcc",
		"Lambert Conic Conformal (1SP)",
		"Lambert Conic Conformal (2SP)"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/krovak.js
function init$24() {
	this.a = 6377397.155;
	this.es = .006674372230614;
	this.e = Math.sqrt(this.es);
	if (!this.lat0) this.lat0 = .863937979737193;
	if (!this.long0) this.long0 = .4334234309119251;
	if (!this.k0) this.k0 = .9999;
	this.s45 = .785398163397448;
	this.s90 = 2 * this.s45;
	this.fi0 = this.lat0;
	this.e2 = this.es;
	this.e = Math.sqrt(this.e2);
	this.alfa = Math.sqrt(1 + this.e2 * Math.pow(Math.cos(this.fi0), 4) / (1 - this.e2));
	this.uq = 1.04216856380474;
	this.u0 = Math.asin(Math.sin(this.fi0) / this.alfa);
	this.g = Math.pow((1 + this.e * Math.sin(this.fi0)) / (1 - this.e * Math.sin(this.fi0)), this.alfa * this.e / 2);
	this.k = Math.tan(this.u0 / 2 + this.s45) / Math.pow(Math.tan(this.fi0 / 2 + this.s45), this.alfa) * this.g;
	this.k1 = this.k0;
	this.n0 = this.a * Math.sqrt(1 - this.e2) / (1 - this.e2 * Math.pow(Math.sin(this.fi0), 2));
	this.s0 = 1.37008346281555;
	this.n = Math.sin(this.s0);
	this.ro0 = this.k1 * this.n0 / Math.tan(this.s0);
	this.ad = this.s90 - this.uq;
}
function forward$23(p) {
	var gfi, u, deltav, s, d, eps, ro;
	var lon = p.x;
	var lat = p.y;
	var delta_lon = adjust_lon_default(lon - this.long0, this.over);
	gfi = Math.pow((1 + this.e * Math.sin(lat)) / (1 - this.e * Math.sin(lat)), this.alfa * this.e / 2);
	u = 2 * (Math.atan(this.k * Math.pow(Math.tan(lat / 2 + this.s45), this.alfa) / gfi) - this.s45);
	deltav = -delta_lon * this.alfa;
	s = Math.asin(Math.cos(this.ad) * Math.sin(u) + Math.sin(this.ad) * Math.cos(u) * Math.cos(deltav));
	d = Math.asin(Math.cos(u) * Math.sin(deltav) / Math.cos(s));
	eps = this.n * d;
	ro = this.ro0 * Math.pow(Math.tan(this.s0 / 2 + this.s45), this.n) / Math.pow(Math.tan(s / 2 + this.s45), this.n);
	p.y = ro * Math.cos(eps) / 1;
	p.x = ro * Math.sin(eps) / 1;
	if (!this.czech) {
		p.y *= -1;
		p.x *= -1;
	}
	return p;
}
function inverse$23(p) {
	var u, deltav, s, d, eps, ro, fi1;
	var ok;
	var tmp = p.x;
	p.x = p.y;
	p.y = tmp;
	if (!this.czech) {
		p.y *= -1;
		p.x *= -1;
	}
	ro = Math.sqrt(p.x * p.x + p.y * p.y);
	eps = Math.atan2(p.y, p.x);
	d = eps / Math.sin(this.s0);
	s = 2 * (Math.atan(Math.pow(this.ro0 / ro, 1 / this.n) * Math.tan(this.s0 / 2 + this.s45)) - this.s45);
	u = Math.asin(Math.cos(this.ad) * Math.sin(s) - Math.sin(this.ad) * Math.cos(s) * Math.cos(d));
	deltav = Math.asin(Math.cos(s) * Math.sin(d) / Math.cos(u));
	p.x = this.long0 - deltav / this.alfa;
	fi1 = u;
	ok = 0;
	var iter = 0;
	do {
		p.y = 2 * (Math.atan(Math.pow(this.k, -1 / this.alfa) * Math.pow(Math.tan(u / 2 + this.s45), 1 / this.alfa) * Math.pow((1 + this.e * Math.sin(fi1)) / (1 - this.e * Math.sin(fi1)), this.e / 2)) - this.s45);
		if (Math.abs(fi1 - p.y) < 1e-10) ok = 1;
		fi1 = p.y;
		iter += 1;
	} while (ok === 0 && iter < 15);
	if (iter >= 15) return null;
	return p;
}
var krovak_default = {
	init: init$24,
	forward: forward$23,
	inverse: inverse$23,
	names: [
		"Krovak",
		"Krovak Modified",
		"Krovak (North Orientated)",
		"Krovak Modified (North Orientated)",
		"krovak"
	]
};
//#endregion
//#region node_modules/proj4/lib/common/mlfn.js
function mlfn_default(e0, e1, e2, e3, phi) {
	return e0 * phi - e1 * Math.sin(2 * phi) + e2 * Math.sin(4 * phi) - e3 * Math.sin(6 * phi);
}
//#endregion
//#region node_modules/proj4/lib/common/e0fn.js
function e0fn_default(x) {
	return 1 - .25 * x * (1 + x / 16 * (3 + 1.25 * x));
}
//#endregion
//#region node_modules/proj4/lib/common/e1fn.js
function e1fn_default(x) {
	return .375 * x * (1 + .25 * x * (1 + .46875 * x));
}
//#endregion
//#region node_modules/proj4/lib/common/e2fn.js
function e2fn_default(x) {
	return .05859375 * x * x * (1 + .75 * x);
}
//#endregion
//#region node_modules/proj4/lib/common/e3fn.js
function e3fn_default(x) {
	return x * x * x * (35 / 3072);
}
//#endregion
//#region node_modules/proj4/lib/common/gN.js
function gN_default(a, e, sinphi) {
	var temp = e * sinphi;
	return a / Math.sqrt(1 - temp * temp);
}
//#endregion
//#region node_modules/proj4/lib/common/adjust_lat.js
function adjust_lat_default(x) {
	return Math.abs(x) < HALF_PI ? x : x - sign_default(x) * Math.PI;
}
//#endregion
//#region node_modules/proj4/lib/common/imlfn.js
function imlfn_default(ml, e0, e1, e2, e3) {
	var phi;
	var dphi;
	phi = ml / e0;
	for (var i = 0; i < 15; i++) {
		dphi = (ml - (e0 * phi - e1 * Math.sin(2 * phi) + e2 * Math.sin(4 * phi) - e3 * Math.sin(6 * phi))) / (e0 - 2 * e1 * Math.cos(2 * phi) + 4 * e2 * Math.cos(4 * phi) - 6 * e3 * Math.cos(6 * phi));
		phi += dphi;
		if (Math.abs(dphi) <= 1e-10) return phi;
	}
	return NaN;
}
//#endregion
//#region node_modules/proj4/lib/projections/cass.js
/**
* @typedef {Object} LocalThis
* @property {number} es
* @property {number} e0
* @property {number} e1
* @property {number} e2
* @property {number} e3
* @property {number} ml0
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$23() {
	if (!this.sphere) {
		this.e0 = e0fn_default(this.es);
		this.e1 = e1fn_default(this.es);
		this.e2 = e2fn_default(this.es);
		this.e3 = e3fn_default(this.es);
		this.ml0 = this.a * mlfn_default(this.e0, this.e1, this.e2, this.e3, this.lat0);
	}
}
function forward$22(p) {
	var x, y;
	var lam = p.x;
	var phi = p.y;
	lam = adjust_lon_default(lam - this.long0, this.over);
	if (this.sphere) {
		x = this.a * Math.asin(Math.cos(phi) * Math.sin(lam));
		y = this.a * (Math.atan2(Math.tan(phi), Math.cos(lam)) - this.lat0);
	} else {
		var sinphi = Math.sin(phi);
		var cosphi = Math.cos(phi);
		var nl = gN_default(this.a, this.e, sinphi);
		var tl = Math.tan(phi) * Math.tan(phi);
		var al = lam * Math.cos(phi);
		var asq = al * al;
		var cl = this.es * cosphi * cosphi / (1 - this.es);
		var ml = this.a * mlfn_default(this.e0, this.e1, this.e2, this.e3, phi);
		x = nl * al * (1 - asq * tl * (1 / 6 - (8 - tl + 8 * cl) * asq / 120));
		y = ml - this.ml0 + nl * sinphi / cosphi * asq * (.5 + (5 - tl + 6 * cl) * asq / 24);
	}
	p.x = x + this.x0;
	p.y = y + this.y0;
	return p;
}
function inverse$22(p) {
	p.x -= this.x0;
	p.y -= this.y0;
	var x = p.x / this.a;
	var y = p.y / this.a;
	var phi, lam;
	if (this.sphere) {
		var dd = y + this.lat0;
		phi = Math.asin(Math.sin(dd) * Math.cos(x));
		lam = Math.atan2(Math.tan(x), Math.cos(dd));
	} else {
		var phi1 = imlfn_default(this.ml0 / this.a + y, this.e0, this.e1, this.e2, this.e3);
		if (Math.abs(Math.abs(phi1) - HALF_PI) <= 1e-10) {
			p.x = this.long0;
			p.y = HALF_PI;
			if (y < 0) p.y *= -1;
			return p;
		}
		var nl1 = gN_default(this.a, this.e, Math.sin(phi1));
		var rl1 = nl1 * nl1 * nl1 / this.a / this.a * (1 - this.es);
		var tl1 = Math.pow(Math.tan(phi1), 2);
		var dl = x * this.a / nl1;
		var dsq = dl * dl;
		phi = phi1 - nl1 * Math.tan(phi1) / rl1 * dl * dl * (.5 - (1 + 3 * tl1) * dl * dl / 24);
		lam = dl * (1 - dsq * (tl1 / 3 + (1 + 3 * tl1) * tl1 * dsq / 15)) / Math.cos(phi1);
	}
	p.x = adjust_lon_default(lam + this.long0, this.over);
	p.y = adjust_lat_default(phi);
	return p;
}
var cass_default = {
	init: init$23,
	forward: forward$22,
	inverse: inverse$22,
	names: [
		"Cassini",
		"Cassini_Soldner",
		"cass"
	]
};
//#endregion
//#region node_modules/proj4/lib/common/qsfnz.js
function qsfnz_default(eccent, sinphi) {
	var con;
	if (eccent > 1e-7) {
		con = eccent * sinphi;
		return (1 - eccent * eccent) * (sinphi / (1 - con * con) - .5 / eccent * Math.log((1 - con) / (1 + con)));
	} else return 2 * sinphi;
}
//#endregion
//#region node_modules/proj4/lib/common/authset.js
var P00 = .3333333333333333;
var P01 = .17222222222222222;
var P02 = .10257936507936508;
var P10 = .06388888888888888;
var P11 = .0664021164021164;
var P20 = .016415012942191543;
function authset(es) {
	var t;
	var APA = [];
	APA[0] = es * P00;
	t = es * es;
	APA[0] += t * P01;
	APA[1] = t * P10;
	t *= es;
	APA[0] += t * P02;
	APA[1] += t * P11;
	APA[2] = t * P20;
	return APA;
}
//#endregion
//#region node_modules/proj4/lib/common/authlat.js
function authlat(beta, APA) {
	var t = beta + beta;
	return beta + APA[0] * Math.sin(t) + APA[1] * Math.sin(t + t) + APA[2] * Math.sin(t + t + t);
}
/**
* Initialize the Lambert Azimuthal Equal Area projection
* @this {import('../defs.js').ProjectionDefinition & LocalThis}
*/
function init$22() {
	var t = Math.abs(this.lat0);
	if (Math.abs(t - HALF_PI) < 1e-10) this.mode = this.lat0 < 0 ? 1 : 2;
	else if (Math.abs(t) < 1e-10) this.mode = 3;
	else this.mode = 4;
	if (this.es > 0) {
		var sinphi;
		this.qp = qsfnz_default(this.e, 1);
		this.mmf = .5 / (1 - this.es);
		this.apa = authset(this.es);
		switch (this.mode) {
			case 2:
				this.dd = 1;
				break;
			case 1:
				this.dd = 1;
				break;
			case 3:
				this.rq = Math.sqrt(.5 * this.qp);
				this.dd = 1 / this.rq;
				this.xmf = 1;
				this.ymf = .5 * this.qp;
				break;
			case 4:
				this.rq = Math.sqrt(.5 * this.qp);
				sinphi = Math.sin(this.lat0);
				this.sinb1 = qsfnz_default(this.e, sinphi) / this.qp;
				this.cosb1 = Math.sqrt(1 - this.sinb1 * this.sinb1);
				this.dd = Math.cos(this.lat0) / (Math.sqrt(1 - this.es * sinphi * sinphi) * this.rq * this.cosb1);
				this.ymf = (this.xmf = this.rq) / this.dd;
				this.xmf *= this.dd;
				break;
		}
	} else if (this.mode === 4) {
		this.sinph0 = Math.sin(this.lat0);
		this.cosph0 = Math.cos(this.lat0);
	}
}
function forward$21(p) {
	var x, y, coslam, sinlam, sinphi, q, sinb, cosb, b, cosphi;
	var lam = p.x;
	var phi = p.y;
	lam = adjust_lon_default(lam - this.long0, this.over);
	if (this.sphere) {
		sinphi = Math.sin(phi);
		cosphi = Math.cos(phi);
		coslam = Math.cos(lam);
		if (this.mode === this.OBLIQ || this.mode === this.EQUIT) {
			y = this.mode === this.EQUIT ? 1 + cosphi * coslam : 1 + this.sinph0 * sinphi + this.cosph0 * cosphi * coslam;
			if (y <= 1e-10) return null;
			y = Math.sqrt(2 / y);
			x = y * cosphi * Math.sin(lam);
			y *= this.mode === this.EQUIT ? sinphi : this.cosph0 * sinphi - this.sinph0 * cosphi * coslam;
		} else if (this.mode === this.N_POLE || this.mode === this.S_POLE) {
			if (this.mode === this.N_POLE) coslam = -coslam;
			if (Math.abs(phi + this.lat0) < 1e-10) return null;
			y = FORTPI - phi * .5;
			y = 2 * (this.mode === this.S_POLE ? Math.cos(y) : Math.sin(y));
			x = y * Math.sin(lam);
			y *= coslam;
		}
	} else {
		sinb = 0;
		cosb = 0;
		b = 0;
		coslam = Math.cos(lam);
		sinlam = Math.sin(lam);
		sinphi = Math.sin(phi);
		q = qsfnz_default(this.e, sinphi);
		if (this.mode === this.OBLIQ || this.mode === this.EQUIT) {
			sinb = q / this.qp;
			cosb = Math.sqrt(1 - sinb * sinb);
		}
		switch (this.mode) {
			case this.OBLIQ:
				b = 1 + this.sinb1 * sinb + this.cosb1 * cosb * coslam;
				break;
			case this.EQUIT:
				b = 1 + cosb * coslam;
				break;
			case this.N_POLE:
				b = HALF_PI + phi;
				q = this.qp - q;
				break;
			case this.S_POLE:
				b = phi - HALF_PI;
				q = this.qp + q;
				break;
		}
		if (Math.abs(b) < 1e-10) return null;
		switch (this.mode) {
			case this.OBLIQ:
			case this.EQUIT:
				b = Math.sqrt(2 / b);
				if (this.mode === this.OBLIQ) y = this.ymf * b * (this.cosb1 * sinb - this.sinb1 * cosb * coslam);
				else y = (b = Math.sqrt(2 / (1 + cosb * coslam))) * sinb * this.ymf;
				x = this.xmf * b * cosb * sinlam;
				break;
			case this.N_POLE:
			case this.S_POLE:
				if (q >= 0) {
					x = (b = Math.sqrt(q)) * sinlam;
					y = coslam * (this.mode === this.S_POLE ? b : -b);
				} else x = y = 0;
				break;
		}
	}
	p.x = this.a * x + this.x0;
	p.y = this.a * y + this.y0;
	return p;
}
function inverse$21(p) {
	p.x -= this.x0;
	p.y -= this.y0;
	var x = p.x / this.a;
	var y = p.y / this.a;
	var lam, phi, cCe, sCe, q, rho, ab;
	if (this.sphere) {
		var cosz = 0, rh, sinz = 0;
		rh = Math.sqrt(x * x + y * y);
		phi = rh * .5;
		if (phi > 1) return null;
		phi = 2 * Math.asin(phi);
		if (this.mode === this.OBLIQ || this.mode === this.EQUIT) {
			sinz = Math.sin(phi);
			cosz = Math.cos(phi);
		}
		switch (this.mode) {
			case this.EQUIT:
				phi = Math.abs(rh) <= 1e-10 ? 0 : Math.asin(y * sinz / rh);
				x *= sinz;
				y = cosz * rh;
				break;
			case this.OBLIQ:
				phi = Math.abs(rh) <= 1e-10 ? this.lat0 : Math.asin(cosz * this.sinph0 + y * sinz * this.cosph0 / rh);
				x *= sinz * this.cosph0;
				y = (cosz - Math.sin(phi) * this.sinph0) * rh;
				break;
			case this.N_POLE:
				y = -y;
				phi = HALF_PI - phi;
				break;
			case this.S_POLE:
				phi -= HALF_PI;
				break;
		}
		lam = y === 0 && (this.mode === this.EQUIT || this.mode === this.OBLIQ) ? 0 : Math.atan2(x, y);
	} else {
		ab = 0;
		if (this.mode === this.OBLIQ || this.mode === this.EQUIT) {
			x /= this.dd;
			y *= this.dd;
			rho = Math.sqrt(x * x + y * y);
			if (rho < 1e-10) {
				p.x = this.long0;
				p.y = this.lat0;
				return p;
			}
			sCe = 2 * Math.asin(.5 * rho / this.rq);
			cCe = Math.cos(sCe);
			x *= sCe = Math.sin(sCe);
			if (this.mode === this.OBLIQ) {
				ab = cCe * this.sinb1 + y * sCe * this.cosb1 / rho;
				q = this.qp * ab;
				y = rho * this.cosb1 * cCe - y * this.sinb1 * sCe;
			} else {
				ab = y * sCe / rho;
				q = this.qp * ab;
				y = rho * cCe;
			}
		} else if (this.mode === this.N_POLE || this.mode === this.S_POLE) {
			if (this.mode === this.N_POLE) y = -y;
			q = x * x + y * y;
			if (!q) {
				p.x = this.long0;
				p.y = this.lat0;
				return p;
			}
			ab = 1 - q / this.qp;
			if (this.mode === this.S_POLE) ab = -ab;
		}
		lam = Math.atan2(x, y);
		phi = authlat(Math.asin(ab), this.apa);
	}
	p.x = adjust_lon_default(this.long0 + lam, this.over);
	p.y = phi;
	return p;
}
var laea_default = {
	init: init$22,
	forward: forward$21,
	inverse: inverse$21,
	names: [
		"Lambert Azimuthal Equal Area",
		"Lambert_Azimuthal_Equal_Area",
		"laea"
	],
	S_POLE: 1,
	N_POLE: 2,
	EQUIT: 3,
	OBLIQ: 4
};
//#endregion
//#region node_modules/proj4/lib/common/asinz.js
function asinz_default(x) {
	if (Math.abs(x) > 1) x = x > 1 ? 1 : -1;
	return Math.asin(x);
}
//#endregion
//#region node_modules/proj4/lib/projections/aea.js
/**
* @typedef {Object} LocalThis
* @property {number} temp
* @property {number} es
* @property {number} e3
* @property {number} sin_po
* @property {number} cos_po
* @property {number} t1
* @property {number} con
* @property {number} ms1
* @property {number} qs1
* @property {number} t2
* @property {number} ms2
* @property {number} qs2
* @property {number} t3
* @property {number} qs0
* @property {number} ns0
* @property {number} c
* @property {number} rh
* @property {number} sin_phi
* @property {number} cos_phi
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$21() {
	if (Math.abs(this.lat1 + this.lat2) < 1e-10) return;
	this.temp = this.b / this.a;
	this.es = 1 - Math.pow(this.temp, 2);
	this.e3 = Math.sqrt(this.es);
	this.sin_po = Math.sin(this.lat1);
	this.cos_po = Math.cos(this.lat1);
	this.t1 = this.sin_po;
	this.con = this.sin_po;
	this.ms1 = msfnz_default(this.e3, this.sin_po, this.cos_po);
	this.qs1 = qsfnz_default(this.e3, this.sin_po);
	this.sin_po = Math.sin(this.lat2);
	this.cos_po = Math.cos(this.lat2);
	this.t2 = this.sin_po;
	this.ms2 = msfnz_default(this.e3, this.sin_po, this.cos_po);
	this.qs2 = qsfnz_default(this.e3, this.sin_po);
	this.sin_po = Math.sin(this.lat0);
	this.cos_po = Math.cos(this.lat0);
	this.t3 = this.sin_po;
	this.qs0 = qsfnz_default(this.e3, this.sin_po);
	if (Math.abs(this.lat1 - this.lat2) > 1e-10) this.ns0 = (this.ms1 * this.ms1 - this.ms2 * this.ms2) / (this.qs2 - this.qs1);
	else this.ns0 = this.con;
	this.c = this.ms1 * this.ms1 + this.ns0 * this.qs1;
	this.rh = this.a * Math.sqrt(this.c - this.ns0 * this.qs0) / this.ns0;
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function forward$20(p) {
	var lon = p.x;
	var lat = p.y;
	this.sin_phi = Math.sin(lat);
	this.cos_phi = Math.cos(lat);
	var qs = qsfnz_default(this.e3, this.sin_phi);
	var rh1 = this.a * Math.sqrt(this.c - this.ns0 * qs) / this.ns0;
	var theta = this.ns0 * adjust_lon_default(lon - this.long0, this.over);
	var x = rh1 * Math.sin(theta) + this.x0;
	var y = this.rh - rh1 * Math.cos(theta) + this.y0;
	p.x = x;
	p.y = y;
	return p;
}
function inverse$20(p) {
	var rh1, qs, con, theta, lon, lat;
	p.x -= this.x0;
	p.y = this.rh - p.y + this.y0;
	if (this.ns0 >= 0) {
		rh1 = Math.sqrt(p.x * p.x + p.y * p.y);
		con = 1;
	} else {
		rh1 = -Math.sqrt(p.x * p.x + p.y * p.y);
		con = -1;
	}
	theta = 0;
	if (rh1 !== 0) theta = Math.atan2(con * p.x, con * p.y);
	con = rh1 * this.ns0 / this.a;
	if (this.sphere) lat = Math.asin((this.c - con * con) / (2 * this.ns0));
	else {
		qs = (this.c - con * con) / this.ns0;
		lat = this.phi1z(this.e3, qs);
	}
	lon = adjust_lon_default(theta / this.ns0 + this.long0, this.over);
	p.x = lon;
	p.y = lat;
	return p;
}
function phi1z(eccent, qs) {
	var sinphi, cosphi, con, com, dphi;
	var phi = asinz_default(.5 * qs);
	if (eccent < 1e-10) return phi;
	var eccnts = eccent * eccent;
	for (var i = 1; i <= 25; i++) {
		sinphi = Math.sin(phi);
		cosphi = Math.cos(phi);
		con = eccent * sinphi;
		com = 1 - con * con;
		dphi = .5 * com * com / cosphi * (qs / (1 - eccnts) - sinphi / com + .5 / eccent * Math.log((1 - con) / (1 + con)));
		phi = phi + dphi;
		if (Math.abs(dphi) <= 1e-7) return phi;
	}
	return null;
}
var aea_default = {
	init: init$21,
	forward: forward$20,
	inverse: inverse$20,
	names: [
		"Albers_Conic_Equal_Area",
		"Albers_Equal_Area",
		"Albers",
		"aea"
	],
	phi1z
};
//#endregion
//#region node_modules/proj4/lib/projections/gnom.js
/**
* @typedef {Object} LocalThis
* @property {number} sin_p14
* @property {number} cos_p14
* @property {number} infinity_dist
* @property {number} rc
*/
/**
reference:
Wolfram Mathworld "Gnomonic Projection"
http://mathworld.wolfram.com/GnomonicProjection.html
Accessed: 12th November 2009
@this {import('../defs.js').ProjectionDefinition & LocalThis}
*/
function init$20() {
	this.sin_p14 = Math.sin(this.lat0);
	this.cos_p14 = Math.cos(this.lat0);
	this.infinity_dist = 1e3 * this.a;
	this.rc = 1;
}
function forward$19(p) {
	var sinphi, cosphi;
	var dlon;
	var coslon;
	var ksp;
	var g;
	var x, y;
	var lon = p.x;
	var lat = p.y;
	dlon = adjust_lon_default(lon - this.long0, this.over);
	sinphi = Math.sin(lat);
	cosphi = Math.cos(lat);
	coslon = Math.cos(dlon);
	g = this.sin_p14 * sinphi + this.cos_p14 * cosphi * coslon;
	ksp = 1;
	if (g > 0 || Math.abs(g) <= 1e-10) {
		x = this.x0 + this.a * ksp * cosphi * Math.sin(dlon) / g;
		y = this.y0 + this.a * ksp * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon) / g;
	} else {
		x = this.x0 + this.infinity_dist * cosphi * Math.sin(dlon);
		y = this.y0 + this.infinity_dist * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon);
	}
	p.x = x;
	p.y = y;
	return p;
}
function inverse$19(p) {
	var rh;
	var sinc, cosc;
	var c;
	var lon, lat;
	p.x = (p.x - this.x0) / this.a;
	p.y = (p.y - this.y0) / this.a;
	p.x /= this.k0;
	p.y /= this.k0;
	if (rh = Math.sqrt(p.x * p.x + p.y * p.y)) {
		c = Math.atan2(rh, this.rc);
		sinc = Math.sin(c);
		cosc = Math.cos(c);
		lat = asinz_default(cosc * this.sin_p14 + p.y * sinc * this.cos_p14 / rh);
		lon = Math.atan2(p.x * sinc, rh * this.cos_p14 * cosc - p.y * this.sin_p14 * sinc);
		lon = adjust_lon_default(this.long0 + lon, this.over);
	} else {
		lat = this.phic0;
		lon = 0;
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var gnom_default = {
	init: init$20,
	forward: forward$19,
	inverse: inverse$19,
	names: ["gnom"]
};
//#endregion
//#region node_modules/proj4/lib/common/iqsfnz.js
function iqsfnz_default(eccent, q) {
	var temp = 1 - (1 - eccent * eccent) / (2 * eccent) * Math.log((1 - eccent) / (1 + eccent));
	if (Math.abs(Math.abs(q) - temp) < 1e-6) if (q < 0) return -1 * HALF_PI;
	else return HALF_PI;
	var phi = Math.asin(.5 * q);
	var dphi;
	var sin_phi;
	var cos_phi;
	var con;
	for (var i = 0; i < 30; i++) {
		sin_phi = Math.sin(phi);
		cos_phi = Math.cos(phi);
		con = eccent * sin_phi;
		dphi = Math.pow(1 - con * con, 2) / (2 * cos_phi) * (q / (1 - eccent * eccent) - sin_phi / (1 - con * con) + .5 / eccent * Math.log((1 - con) / (1 + con)));
		phi += dphi;
		if (Math.abs(dphi) <= 1e-10) return phi;
	}
	return NaN;
}
//#endregion
//#region node_modules/proj4/lib/projections/cea.js
/**
* @typedef {Object} LocalThis
* @property {number} e
*/
/**
reference:
"Cartographic Projection Procedures for the UNIX Environment-
A User's Manual" by Gerald I. Evenden,
USGS Open File Report 90-284and Release 4 Interim Reports (2003)
@this {import('../defs.js').ProjectionDefinition & LocalThis}
*/
function init$19() {
	if (!this.sphere) this.k0 = msfnz_default(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts));
}
function forward$18(p) {
	var lon = p.x;
	var lat = p.y;
	var x, y;
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	if (this.sphere) {
		x = this.x0 + this.a * dlon * Math.cos(this.lat_ts);
		y = this.y0 + this.a * Math.sin(lat) / Math.cos(this.lat_ts);
	} else {
		var qs = qsfnz_default(this.e, Math.sin(lat));
		x = this.x0 + this.a * this.k0 * dlon;
		y = this.y0 + this.a * qs * .5 / this.k0;
	}
	p.x = x;
	p.y = y;
	return p;
}
function inverse$18(p) {
	p.x -= this.x0;
	p.y -= this.y0;
	var lon, lat;
	if (this.sphere) {
		lon = adjust_lon_default(this.long0 + p.x / this.a / Math.cos(this.lat_ts), this.over);
		lat = Math.asin(p.y / this.a * Math.cos(this.lat_ts));
	} else {
		lat = iqsfnz_default(this.e, 2 * p.y * this.k0 / this.a);
		lon = adjust_lon_default(this.long0 + p.x / (this.a * this.k0), this.over);
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var cea_default = {
	init: init$19,
	forward: forward$18,
	inverse: inverse$18,
	names: ["cea"]
};
//#endregion
//#region node_modules/proj4/lib/projections/eqc.js
function init$18() {
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.lat0 = this.lat0 || 0;
	this.long0 = this.long0 || 0;
	this.lat_ts = this.lat_ts || 0;
	this.title = this.title || "Equidistant Cylindrical (Plate Carre)";
	this.rc = Math.cos(this.lat_ts);
}
function forward$17(p) {
	var lon = p.x;
	var lat = p.y;
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	var dlat = adjust_lat_default(lat - this.lat0);
	p.x = this.x0 + this.a * dlon * this.rc;
	p.y = this.y0 + this.a * dlat;
	return p;
}
function inverse$17(p) {
	var x = p.x;
	var y = p.y;
	p.x = adjust_lon_default(this.long0 + (x - this.x0) / (this.a * this.rc), this.over);
	p.y = adjust_lat_default(this.lat0 + (y - this.y0) / this.a);
	return p;
}
var eqc_default = {
	init: init$18,
	forward: forward$17,
	inverse: inverse$17,
	names: [
		"Equirectangular",
		"Equidistant_Cylindrical",
		"Equidistant_Cylindrical_Spherical",
		"eqc"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/poly.js
/**
* @typedef {Object} LocalThis
* @property {number} temp
* @property {number} es
* @property {number} e
* @property {number} e0
* @property {number} e1
* @property {number} e2
* @property {number} e3
* @property {number} ml0
*/
var MAX_ITER$1 = 20;
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$17() {
	this.temp = this.b / this.a;
	this.es = 1 - Math.pow(this.temp, 2);
	this.e = Math.sqrt(this.es);
	this.e0 = e0fn_default(this.es);
	this.e1 = e1fn_default(this.es);
	this.e2 = e2fn_default(this.es);
	this.e3 = e3fn_default(this.es);
	this.ml0 = this.a * mlfn_default(this.e0, this.e1, this.e2, this.e3, this.lat0);
}
function forward$16(p) {
	var lon = p.x;
	var lat = p.y;
	var x, y, el;
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	el = dlon * Math.sin(lat);
	if (this.sphere) if (Math.abs(lat) <= 1e-10) {
		x = this.a * dlon;
		y = -1 * this.a * this.lat0;
	} else {
		x = this.a * Math.sin(el) / Math.tan(lat);
		y = this.a * (adjust_lat_default(lat - this.lat0) + (1 - Math.cos(el)) / Math.tan(lat));
	}
	else if (Math.abs(lat) <= 1e-10) {
		x = this.a * dlon;
		y = -1 * this.ml0;
	} else {
		var nl = gN_default(this.a, this.e, Math.sin(lat)) / Math.tan(lat);
		x = nl * Math.sin(el);
		y = this.a * mlfn_default(this.e0, this.e1, this.e2, this.e3, lat) - this.ml0 + nl * (1 - Math.cos(el));
	}
	p.x = x + this.x0;
	p.y = y + this.y0;
	return p;
}
function inverse$16(p) {
	var lon, lat, x, y, i;
	var al, bl;
	var phi, dphi;
	x = p.x - this.x0;
	y = p.y - this.y0;
	if (this.sphere) if (Math.abs(y + this.a * this.lat0) <= 1e-10) {
		lon = adjust_lon_default(x / this.a + this.long0, this.over);
		lat = 0;
	} else {
		al = this.lat0 + y / this.a;
		bl = x * x / this.a / this.a + al * al;
		phi = al;
		var tanphi;
		for (i = MAX_ITER$1; i; --i) {
			tanphi = Math.tan(phi);
			dphi = -1 * (al * (phi * tanphi + 1) - phi - .5 * (phi * phi + bl) * tanphi) / ((phi - al) / tanphi - 1);
			phi += dphi;
			if (Math.abs(dphi) <= 1e-10) {
				lat = phi;
				break;
			}
		}
		lon = adjust_lon_default(this.long0 + Math.asin(x * Math.tan(phi) / this.a) / Math.sin(lat), this.over);
	}
	else if (Math.abs(y + this.ml0) <= 1e-10) {
		lat = 0;
		lon = adjust_lon_default(this.long0 + x / this.a, this.over);
	} else {
		al = (this.ml0 + y) / this.a;
		bl = x * x / this.a / this.a + al * al;
		phi = al;
		var cl, mln, mlnp, ma;
		var con;
		for (i = MAX_ITER$1; i; --i) {
			con = this.e * Math.sin(phi);
			cl = Math.sqrt(1 - con * con) * Math.tan(phi);
			mln = this.a * mlfn_default(this.e0, this.e1, this.e2, this.e3, phi);
			mlnp = this.e0 - 2 * this.e1 * Math.cos(2 * phi) + 4 * this.e2 * Math.cos(4 * phi) - 6 * this.e3 * Math.cos(6 * phi);
			ma = mln / this.a;
			dphi = (al * (cl * ma + 1) - ma - .5 * cl * (ma * ma + bl)) / (this.es * Math.sin(2 * phi) * (ma * ma + bl - 2 * al * ma) / (4 * cl) + (al - ma) * (cl * mlnp - 2 / Math.sin(2 * phi)) - mlnp);
			phi -= dphi;
			if (Math.abs(dphi) <= 1e-10) {
				lat = phi;
				break;
			}
		}
		cl = Math.sqrt(1 - this.es * Math.pow(Math.sin(lat), 2)) * Math.tan(lat);
		lon = adjust_lon_default(this.long0 + Math.asin(x * cl / this.a) / Math.sin(lat), this.over);
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var poly_default = {
	init: init$17,
	forward: forward$16,
	inverse: inverse$16,
	names: [
		"Polyconic",
		"American_Polyconic",
		"poly"
	]
};
function init$16() {
	this.A = [];
	this.A[1] = .6399175073;
	this.A[2] = -.1358797613;
	this.A[3] = .063294409;
	this.A[4] = -.02526853;
	this.A[5] = .0117879;
	this.A[6] = -.0055161;
	this.A[7] = .0026906;
	this.A[8] = -.001333;
	this.A[9] = 67e-5;
	this.A[10] = -34e-5;
	this.B_re = [];
	this.B_im = [];
	this.B_re[1] = .7557853228;
	this.B_im[1] = 0;
	this.B_re[2] = .249204646;
	this.B_im[2] = .003371507;
	this.B_re[3] = -.001541739;
	this.B_im[3] = .04105856;
	this.B_re[4] = -.10162907;
	this.B_im[4] = .01727609;
	this.B_re[5] = -.26623489;
	this.B_im[5] = -.36249218;
	this.B_re[6] = -.6870983;
	this.B_im[6] = -1.1651967;
	this.C_re = [];
	this.C_im = [];
	this.C_re[1] = 1.3231270439;
	this.C_im[1] = 0;
	this.C_re[2] = -.577245789;
	this.C_im[2] = -.007809598;
	this.C_re[3] = .508307513;
	this.C_im[3] = -.112208952;
	this.C_re[4] = -.15094762;
	this.C_im[4] = .18200602;
	this.C_re[5] = 1.01418179;
	this.C_im[5] = 1.64497696;
	this.C_re[6] = 1.9660549;
	this.C_im[6] = 2.5127645;
	this.D = [];
	this.D[1] = 1.5627014243;
	this.D[2] = .5185406398;
	this.D[3] = -.03333098;
	this.D[4] = -.1052906;
	this.D[5] = -.0368594;
	this.D[6] = .007317;
	this.D[7] = .0122;
	this.D[8] = .00394;
	this.D[9] = -.0013;
}
/**
New Zealand Map Grid Forward  - long/lat to x/y
long/lat in radians
*/
function forward$15(p) {
	var n;
	var lon = p.x;
	var delta_lat = p.y - this.lat0;
	var delta_lon = lon - this.long0;
	var d_phi = delta_lat / SEC_TO_RAD * 1e-5;
	var d_lambda = delta_lon;
	var d_phi_n = 1;
	var d_psi = 0;
	for (n = 1; n <= 10; n++) {
		d_phi_n = d_phi_n * d_phi;
		d_psi = d_psi + this.A[n] * d_phi_n;
	}
	var th_re = d_psi;
	var th_im = d_lambda;
	var th_n_re = 1;
	var th_n_im = 0;
	var th_n_re1;
	var th_n_im1;
	var z_re = 0;
	var z_im = 0;
	for (n = 1; n <= 6; n++) {
		th_n_re1 = th_n_re * th_re - th_n_im * th_im;
		th_n_im1 = th_n_im * th_re + th_n_re * th_im;
		th_n_re = th_n_re1;
		th_n_im = th_n_im1;
		z_re = z_re + this.B_re[n] * th_n_re - this.B_im[n] * th_n_im;
		z_im = z_im + this.B_im[n] * th_n_re + this.B_re[n] * th_n_im;
	}
	p.x = z_im * this.a + this.x0;
	p.y = z_re * this.a + this.y0;
	return p;
}
/**
New Zealand Map Grid Inverse  -  x/y to long/lat
*/
function inverse$15(p) {
	var n;
	var x = p.x;
	var y = p.y;
	var delta_x = x - this.x0;
	var z_re = (y - this.y0) / this.a;
	var z_im = delta_x / this.a;
	var z_n_re = 1;
	var z_n_im = 0;
	var z_n_re1;
	var z_n_im1;
	var th_re = 0;
	var th_im = 0;
	for (n = 1; n <= 6; n++) {
		z_n_re1 = z_n_re * z_re - z_n_im * z_im;
		z_n_im1 = z_n_im * z_re + z_n_re * z_im;
		z_n_re = z_n_re1;
		z_n_im = z_n_im1;
		th_re = th_re + this.C_re[n] * z_n_re - this.C_im[n] * z_n_im;
		th_im = th_im + this.C_im[n] * z_n_re + this.C_re[n] * z_n_im;
	}
	for (var i = 0; i < this.iterations; i++) {
		var th_n_re = th_re;
		var th_n_im = th_im;
		var th_n_re1;
		var th_n_im1;
		var num_re = z_re;
		var num_im = z_im;
		for (n = 2; n <= 6; n++) {
			th_n_re1 = th_n_re * th_re - th_n_im * th_im;
			th_n_im1 = th_n_im * th_re + th_n_re * th_im;
			th_n_re = th_n_re1;
			th_n_im = th_n_im1;
			num_re = num_re + (n - 1) * (this.B_re[n] * th_n_re - this.B_im[n] * th_n_im);
			num_im = num_im + (n - 1) * (this.B_im[n] * th_n_re + this.B_re[n] * th_n_im);
		}
		th_n_re = 1;
		th_n_im = 0;
		var den_re = this.B_re[1];
		var den_im = this.B_im[1];
		for (n = 2; n <= 6; n++) {
			th_n_re1 = th_n_re * th_re - th_n_im * th_im;
			th_n_im1 = th_n_im * th_re + th_n_re * th_im;
			th_n_re = th_n_re1;
			th_n_im = th_n_im1;
			den_re = den_re + n * (this.B_re[n] * th_n_re - this.B_im[n] * th_n_im);
			den_im = den_im + n * (this.B_im[n] * th_n_re + this.B_re[n] * th_n_im);
		}
		var den2 = den_re * den_re + den_im * den_im;
		th_re = (num_re * den_re + num_im * den_im) / den2;
		th_im = (num_im * den_re - num_re * den_im) / den2;
	}
	var d_psi = th_re;
	var d_lambda = th_im;
	var d_psi_n = 1;
	var d_phi = 0;
	for (n = 1; n <= 9; n++) {
		d_psi_n = d_psi_n * d_psi;
		d_phi = d_phi + this.D[n] * d_psi_n;
	}
	var lat = this.lat0 + d_phi * SEC_TO_RAD * 1e5;
	p.x = this.long0 + d_lambda;
	p.y = lat;
	return p;
}
var nzmg_default = {
	init: init$16,
	forward: forward$15,
	inverse: inverse$15,
	names: ["New_Zealand_Map_Grid", "nzmg"],
	iterations: 1
};
//#endregion
//#region node_modules/proj4/lib/projections/mill.js
function init$15() {}
function forward$14(p) {
	var lon = p.x;
	var lat = p.y;
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	var x = this.x0 + this.a * dlon;
	var y = this.y0 + this.a * Math.log(Math.tan(Math.PI / 4 + lat / 2.5)) * 1.25;
	p.x = x;
	p.y = y;
	return p;
}
function inverse$14(p) {
	p.x -= this.x0;
	p.y -= this.y0;
	var lon = adjust_lon_default(this.long0 + p.x / this.a, this.over);
	var lat = 2.5 * (Math.atan(Math.exp(.8 * p.y / this.a)) - Math.PI / 4);
	p.x = lon;
	p.y = lat;
	return p;
}
var mill_default = {
	init: init$15,
	forward: forward$14,
	inverse: inverse$14,
	names: ["Miller_Cylindrical", "mill"]
};
//#endregion
//#region node_modules/proj4/lib/projections/sinu.js
var MAX_ITER = 20;
/**
* @typedef {Object} LocalThis
* @property {Array<number>} en
* @property {number} n
* @property {number} m
* @property {number} C_y
* @property {number} C_x
* @property {number} es
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$14() {
	this.long0 = this.long0 || 0;
	if (!this.sphere) this.en = pj_enfn_default(this.es);
	else {
		this.n = 1;
		this.m = 0;
		this.es = 0;
		this.C_y = Math.sqrt((this.m + 1) / this.n);
		this.C_x = this.C_y / (this.m + 1);
	}
}
function forward$13(p) {
	var x, y;
	var lon = p.x;
	var lat = p.y;
	lon = adjust_lon_default(lon - this.long0, this.over);
	if (this.sphere) {
		if (!this.m) lat = this.n !== 1 ? Math.asin(this.n * Math.sin(lat)) : lat;
		else {
			var k = this.n * Math.sin(lat);
			for (var i = MAX_ITER; i; --i) {
				var V = (this.m * lat + Math.sin(lat) - k) / (this.m + Math.cos(lat));
				lat -= V;
				if (Math.abs(V) < 1e-10) break;
			}
		}
		x = this.a * this.C_x * lon * (this.m + Math.cos(lat));
		y = this.a * this.C_y * lat;
	} else {
		var s = Math.sin(lat);
		var c = Math.cos(lat);
		y = this.a * pj_mlfn_default(lat, s, c, this.en);
		x = this.a * lon * c / Math.sqrt(1 - this.es * s * s);
	}
	p.x = x;
	p.y = y;
	return p;
}
function inverse$13(p) {
	var lat, temp, lon, s;
	p.x -= this.x0;
	lon = p.x / this.a;
	p.y -= this.y0;
	lat = p.y / this.a;
	if (this.sphere) {
		lat /= this.C_y;
		lon = lon / (this.C_x * (this.m + Math.cos(lat)));
		if (this.m) lat = asinz_default((this.m * lat + Math.sin(lat)) / this.n);
		else if (this.n !== 1) lat = asinz_default(Math.sin(lat) / this.n);
		lon = adjust_lon_default(lon + this.long0, this.over);
		lat = adjust_lat_default(lat);
	} else {
		lat = pj_inv_mlfn_default(p.y / this.a, this.es, this.en);
		s = Math.abs(lat);
		if (s < HALF_PI) {
			s = Math.sin(lat);
			temp = this.long0 + p.x * Math.sqrt(1 - this.es * s * s) / (this.a * Math.cos(lat));
			lon = adjust_lon_default(temp, this.over);
		} else if (s - 1e-10 < HALF_PI) lon = this.long0;
	}
	p.x = lon;
	p.y = lat;
	return p;
}
var sinu_default = {
	init: init$14,
	forward: forward$13,
	inverse: inverse$13,
	names: ["Sinusoidal", "sinu"]
};
//#endregion
//#region node_modules/proj4/lib/projections/eck6.js
/**
* Eckert VI projection — spherical sinusoidal variant with m=1, n=1+π/2.
* Always forces spherical computation regardless of the ellipsoid.
*
* @typedef {Object} LocalThis
* @property {number} m
* @property {number} n
* @property {number} C_y
* @property {number} C_x
* @property {number} es
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$13() {
	this.sphere = true;
	this.b = this.a;
	this.m = 1;
	this.n = 2.5707963267948966;
	this.es = 0;
	this.C_y = Math.sqrt((this.m + 1) / this.n);
	this.C_x = this.C_y / (this.m + 1);
}
var eck6_default = {
	init: init$13,
	forward: forward$13,
	inverse: inverse$13,
	names: ["Eckert_VI", "eck6"]
};
//#endregion
//#region node_modules/proj4/lib/projections/moll.js
/** @this {import('../defs.js').ProjectionDefinition} */
function init$12() {
	this.x0 = this.x0 !== void 0 ? this.x0 : 0;
	this.y0 = this.y0 !== void 0 ? this.y0 : 0;
	this.long0 = this.long0 !== void 0 ? this.long0 : 0;
}
function forward$11(p) {
	var lon = p.x;
	var lat = p.y;
	var delta_lon = adjust_lon_default(lon - this.long0, this.over);
	var theta = lat;
	var con = Math.PI * Math.sin(lat);
	while (true) {
		var delta_theta = -(theta + Math.sin(theta) - con) / (1 + Math.cos(theta));
		theta += delta_theta;
		if (Math.abs(delta_theta) < 1e-10) break;
	}
	theta /= 2;
	if (Math.PI / 2 - Math.abs(lat) < 1e-10) delta_lon = 0;
	var x = .900316316158 * this.a * delta_lon * Math.cos(theta) + this.x0;
	var y = 1.4142135623731 * this.a * Math.sin(theta) + this.y0;
	p.x = x;
	p.y = y;
	return p;
}
function inverse$11(p) {
	var theta;
	var arg;
	p.x -= this.x0;
	p.y -= this.y0;
	arg = p.y / (1.4142135623731 * this.a);
	if (Math.abs(arg) > .999999999999) arg = .999999999999;
	theta = Math.asin(arg);
	var lon = adjust_lon_default(this.long0 + p.x / (.900316316158 * this.a * Math.cos(theta)), this.over);
	if (lon < -Math.PI) lon = -Math.PI;
	if (lon > Math.PI) lon = Math.PI;
	arg = (2 * theta + Math.sin(2 * theta)) / Math.PI;
	if (Math.abs(arg) > 1) arg = 1;
	var lat = Math.asin(arg);
	p.x = lon;
	p.y = lat;
	return p;
}
var moll_default = {
	init: init$12,
	forward: forward$11,
	inverse: inverse$11,
	names: ["Mollweide", "moll"]
};
//#endregion
//#region node_modules/proj4/lib/projections/eqdc.js
/**
* @typedef {Object} LocalThis
* @property {number} temp
* @property {number} es
* @property {number} e
* @property {number} e0
* @property {number} e1
* @property {number} e2
* @property {number} e3
* @property {number} sin_phi
* @property {number} cos_phi
* @property {number} ms1
* @property {number} ml1
* @property {number} ms2
* @property {number} ml2
* @property {number} ns
* @property {number} g
* @property {number} ml0
* @property {number} rh
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$11() {
	if (Math.abs(this.lat1 + this.lat2) < 1e-10) return;
	this.lat2 = this.lat2 || this.lat1;
	this.temp = this.b / this.a;
	this.es = 1 - Math.pow(this.temp, 2);
	this.e = Math.sqrt(this.es);
	this.e0 = e0fn_default(this.es);
	this.e1 = e1fn_default(this.es);
	this.e2 = e2fn_default(this.es);
	this.e3 = e3fn_default(this.es);
	this.sin_phi = Math.sin(this.lat1);
	this.cos_phi = Math.cos(this.lat1);
	this.ms1 = msfnz_default(this.e, this.sin_phi, this.cos_phi);
	this.ml1 = mlfn_default(this.e0, this.e1, this.e2, this.e3, this.lat1);
	if (Math.abs(this.lat1 - this.lat2) < 1e-10) this.ns = this.sin_phi;
	else {
		this.sin_phi = Math.sin(this.lat2);
		this.cos_phi = Math.cos(this.lat2);
		this.ms2 = msfnz_default(this.e, this.sin_phi, this.cos_phi);
		this.ml2 = mlfn_default(this.e0, this.e1, this.e2, this.e3, this.lat2);
		this.ns = (this.ms1 - this.ms2) / (this.ml2 - this.ml1);
	}
	this.g = this.ml1 + this.ms1 / this.ns;
	this.ml0 = mlfn_default(this.e0, this.e1, this.e2, this.e3, this.lat0);
	this.rh = this.a * (this.g - this.ml0);
}
function forward$10(p) {
	var lon = p.x;
	var lat = p.y;
	var rh1;
	if (this.sphere) rh1 = this.a * (this.g - lat);
	else {
		var ml = mlfn_default(this.e0, this.e1, this.e2, this.e3, lat);
		rh1 = this.a * (this.g - ml);
	}
	var theta = this.ns * adjust_lon_default(lon - this.long0, this.over);
	var x = this.x0 + rh1 * Math.sin(theta);
	var y = this.y0 + this.rh - rh1 * Math.cos(theta);
	p.x = x;
	p.y = y;
	return p;
}
function inverse$10(p) {
	p.x -= this.x0;
	p.y = this.rh - p.y + this.y0;
	var con, rh1, lat, lon;
	if (this.ns >= 0) {
		rh1 = Math.sqrt(p.x * p.x + p.y * p.y);
		con = 1;
	} else {
		rh1 = -Math.sqrt(p.x * p.x + p.y * p.y);
		con = -1;
	}
	var theta = 0;
	if (rh1 !== 0) theta = Math.atan2(con * p.x, con * p.y);
	if (this.sphere) {
		lon = adjust_lon_default(this.long0 + theta / this.ns, this.over);
		lat = adjust_lat_default(this.g - rh1 / this.a);
		p.x = lon;
		p.y = lat;
		return p;
	} else {
		lat = imlfn_default(this.g - rh1 / this.a, this.e0, this.e1, this.e2, this.e3);
		lon = adjust_lon_default(this.long0 + theta / this.ns, this.over);
		p.x = lon;
		p.y = lat;
		return p;
	}
}
var eqdc_default = {
	init: init$11,
	forward: forward$10,
	inverse: inverse$10,
	names: ["Equidistant_Conic", "eqdc"]
};
//#endregion
//#region node_modules/proj4/lib/projections/vandg.js
/**
* @typedef {Object} LocalThis
* @property {number} R - Radius of the Earth
*/
/**
* Initialize the Van Der Grinten projection
* @this {import('../defs.js').ProjectionDefinition & LocalThis}
*/
function init$10() {
	this.R = this.a;
}
function forward$9(p) {
	var lon = p.x;
	var lat = p.y;
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	var x, y;
	if (Math.abs(lat) <= 1e-10) {
		x = this.x0 + this.R * dlon;
		y = this.y0;
		p.x = x;
		p.y = y;
		return p;
	}
	var theta = asinz_default(2 * Math.abs(lat / Math.PI));
	if (Math.abs(dlon) <= 1e-10 || Math.abs(Math.abs(lat) - HALF_PI) <= 1e-10) {
		x = this.x0;
		if (lat >= 0) y = this.y0 + Math.PI * this.R * Math.tan(.5 * theta);
		else y = this.y0 + Math.PI * this.R * -Math.tan(.5 * theta);
		p.x = x;
		p.y = y;
		return p;
	}
	var al = .5 * Math.abs(Math.PI / dlon - dlon / Math.PI);
	var asq = al * al;
	var sinth = Math.sin(theta);
	var costh = Math.cos(theta);
	var g = costh / (sinth + costh - 1);
	var gsq = g * g;
	var m = g * (2 / sinth - 1);
	var msq = m * m;
	var con = Math.PI * this.R * (al * (g - msq) + Math.sqrt(asq * (g - msq) * (g - msq) - (msq + asq) * (gsq - msq))) / (msq + asq);
	if (dlon < 0) con = -con;
	x = this.x0 + con;
	var q = asq + g;
	con = Math.PI * this.R * (m * q - al * Math.sqrt((msq + asq) * (asq + 1) - q * q)) / (msq + asq);
	if (lat >= 0) y = this.y0 + con;
	else y = this.y0 - con;
	p.x = x;
	p.y = y;
	return p;
}
function inverse$9(p) {
	var lon, lat;
	var xx, yy, xys, c1, c2, c3;
	var a1;
	var m1;
	var con;
	var th1;
	var d;
	p.x -= this.x0;
	p.y -= this.y0;
	con = Math.PI * this.R;
	xx = p.x / con;
	yy = p.y / con;
	xys = xx * xx + yy * yy;
	c1 = -Math.abs(yy) * (1 + xys);
	c2 = c1 - 2 * yy * yy + xx * xx;
	c3 = -2 * c1 + 1 + 2 * yy * yy + xys * xys;
	d = yy * yy / c3 + (2 * c2 * c2 * c2 / c3 / c3 / c3 - 9 * c1 * c2 / c3 / c3) / 27;
	a1 = (c1 - c2 * c2 / 3 / c3) / c3;
	m1 = 2 * Math.sqrt(-a1 / 3);
	con = 3 * d / a1 / m1;
	if (Math.abs(con) > 1) if (con >= 0) con = 1;
	else con = -1;
	th1 = Math.acos(con) / 3;
	if (p.y >= 0) lat = (-m1 * Math.cos(th1 + Math.PI / 3) - c2 / 3 / c3) * Math.PI;
	else lat = -(-m1 * Math.cos(th1 + Math.PI / 3) - c2 / 3 / c3) * Math.PI;
	if (Math.abs(xx) < 1e-10) lon = this.long0;
	else lon = adjust_lon_default(this.long0 + Math.PI * (xys - 1 + Math.sqrt(1 + 2 * (xx * xx - yy * yy) + xys * xys)) / 2 / xx, this.over);
	p.x = lon;
	p.y = lat;
	return p;
}
var vandg_default = {
	init: init$10,
	forward: forward$9,
	inverse: inverse$9,
	names: [
		"Van_der_Grinten_I",
		"VanDerGrinten",
		"Van_der_Grinten",
		"vandg"
	]
};
//#endregion
//#region node_modules/proj4/lib/common/vincenty.js
/**
* Calculates the inverse geodesic problem using Vincenty's formulae.
* Computes the forward azimuth and ellipsoidal distance between two points
* specified by latitude and longitude on the surface of an ellipsoid.
*
* @param {number} lat1 Latitude of the first point in radians.
* @param {number} lon1 Longitude of the first point in radians.
* @param {number} lat2 Latitude of the second point in radians.
* @param {number} lon2 Longitude of the second point in radians.
* @param {number} a Semi-major axis of the ellipsoid (meters).
* @param {number} f Flattening of the ellipsoid.
* @returns {{ azi1: number, s12: number }} An object containing:
*   - azi1: Forward azimuth from the first point to the second point (radians).
*   - s12: Ellipsoidal distance between the two points (meters).
*/
function vincentyInverse(lat1, lon1, lat2, lon2, a, f) {
	const L = lon2 - lon1;
	const U1 = Math.atan((1 - f) * Math.tan(lat1));
	const U2 = Math.atan((1 - f) * Math.tan(lat2));
	const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
	const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
	let lambda = L, lambdaP, iterLimit = 100;
	let sinLambda, cosLambda, sinSigma, cosSigma, sigma, sinAlpha, cos2Alpha, cos2SigmaM, C;
	let uSq, A, B, deltaSigma, s;
	do {
		sinLambda = Math.sin(lambda);
		cosLambda = Math.cos(lambda);
		sinSigma = Math.sqrt(cosU2 * sinLambda * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
		if (sinSigma === 0) return {
			azi1: 0,
			s12: 0
		};
		cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
		sigma = Math.atan2(sinSigma, cosSigma);
		sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
		cos2Alpha = 1 - sinAlpha * sinAlpha;
		cos2SigmaM = cos2Alpha !== 0 ? cosSigma - 2 * sinU1 * sinU2 / cos2Alpha : 0;
		C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
		lambdaP = lambda;
		lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
	} while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
	if (iterLimit === 0) return {
		azi1: NaN,
		s12: NaN
	};
	uSq = cos2Alpha * (a * a - a * (1 - f) * (a * (1 - f))) / (a * (1 - f) * (a * (1 - f)));
	A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
	B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
	deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
	s = a * (1 - f) * A * (sigma - deltaSigma);
	return {
		azi1: Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda),
		s12: s
	};
}
/**
* Solves the direct geodetic problem using Vincenty's formulae.
* Given a starting point, initial azimuth, and distance, computes the destination point on the ellipsoid.
*
* @param {number} lat1 Latitude of the starting point in radians.
* @param {number} lon1 Longitude of the starting point in radians.
* @param {number} azi1 Initial azimuth (forward azimuth) in radians.
* @param {number} s12 Distance to travel from the starting point in meters.
* @param {number} a Semi-major axis of the ellipsoid in meters.
* @param {number} f Flattening of the ellipsoid.
* @returns {{lat2: number, lon2: number}} The latitude and longitude (in radians) of the destination point.
*/
function vincentyDirect(lat1, lon1, azi1, s12, a, f) {
	const U1 = Math.atan((1 - f) * Math.tan(lat1));
	const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
	const sinAlpha1 = Math.sin(azi1), cosAlpha1 = Math.cos(azi1);
	const sigma1 = Math.atan2(sinU1, cosU1 * cosAlpha1);
	const sinAlpha = cosU1 * sinAlpha1;
	const cos2Alpha = 1 - sinAlpha * sinAlpha;
	const uSq = cos2Alpha * (a * a - a * (1 - f) * (a * (1 - f))) / (a * (1 - f) * (a * (1 - f)));
	const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
	const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
	let sigma = s12 / (a * (1 - f) * A), sigmaP, iterLimit = 100;
	let cos2SigmaM, sinSigma, cosSigma, deltaSigma;
	do {
		cos2SigmaM = Math.cos(2 * sigma1 + sigma);
		sinSigma = Math.sin(sigma);
		cosSigma = Math.cos(sigma);
		deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
		sigmaP = sigma;
		sigma = s12 / (a * (1 - f) * A) + deltaSigma;
	} while (Math.abs(sigma - sigmaP) > 1e-12 && --iterLimit > 0);
	if (iterLimit === 0) return {
		lat2: NaN,
		lon2: NaN
	};
	const tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
	const lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
	const lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
	const C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
	return {
		lat2,
		lon2: lon1 + (lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))))
	};
}
//#endregion
//#region node_modules/proj4/lib/projections/aeqd.js
/**
* @typedef {Object} LocalThis
* @property {number} es
* @property {number} sin_p12
* @property {number} cos_p12
* @property {number} a
* @property {number} f
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$9() {
	this.sin_p12 = Math.sin(this.lat0);
	this.cos_p12 = Math.cos(this.lat0);
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.long0 = this.long0 || 0;
	this.f = this.es / (1 + Math.sqrt(1 - this.es));
}
function forward$8(p) {
	var lon = p.x;
	var lat = p.y;
	var sinphi = Math.sin(p.y);
	var cosphi = Math.cos(p.y);
	var dlon = adjust_lon_default(lon - this.long0, this.over);
	var e0, e1, e2, e3, Mlp, Ml, c, kp, cos_c, vars, azi1;
	if (this.sphere) if (Math.abs(this.sin_p12 - 1) <= 1e-10) {
		p.x = this.x0 + this.a * (HALF_PI - lat) * Math.sin(dlon);
		p.y = this.y0 - this.a * (HALF_PI - lat) * Math.cos(dlon);
		return p;
	} else if (Math.abs(this.sin_p12 + 1) <= 1e-10) {
		p.x = this.x0 + this.a * (HALF_PI + lat) * Math.sin(dlon);
		p.y = this.y0 + this.a * (HALF_PI + lat) * Math.cos(dlon);
		return p;
	} else {
		cos_c = this.sin_p12 * sinphi + this.cos_p12 * cosphi * Math.cos(dlon);
		c = Math.acos(cos_c);
		kp = c ? c / Math.sin(c) : 1;
		p.x = this.x0 + this.a * kp * cosphi * Math.sin(dlon);
		p.y = this.y0 + this.a * kp * (this.cos_p12 * sinphi - this.sin_p12 * cosphi * Math.cos(dlon));
		return p;
	}
	else {
		e0 = e0fn_default(this.es);
		e1 = e1fn_default(this.es);
		e2 = e2fn_default(this.es);
		e3 = e3fn_default(this.es);
		if (Math.abs(this.sin_p12 - 1) <= 1e-10) {
			Mlp = this.a * mlfn_default(e0, e1, e2, e3, HALF_PI);
			Ml = this.a * mlfn_default(e0, e1, e2, e3, lat);
			p.x = this.x0 + (Mlp - Ml) * Math.sin(dlon);
			p.y = this.y0 - (Mlp - Ml) * Math.cos(dlon);
			return p;
		} else if (Math.abs(this.sin_p12 + 1) <= 1e-10) {
			Mlp = this.a * mlfn_default(e0, e1, e2, e3, HALF_PI);
			Ml = this.a * mlfn_default(e0, e1, e2, e3, lat);
			p.x = this.x0 + (Mlp + Ml) * Math.sin(dlon);
			p.y = this.y0 + (Mlp + Ml) * Math.cos(dlon);
			return p;
		} else {
			if (Math.abs(lon) < 1e-10 && Math.abs(lat - this.lat0) < 1e-10) {
				p.x = this.x0;
				p.y = this.y0;
				return p;
			}
			vars = vincentyInverse(this.lat0, this.long0, lat, lon, this.a, this.f);
			azi1 = vars.azi1;
			p.x = this.x0 + vars.s12 * Math.sin(azi1);
			p.y = this.y0 + vars.s12 * Math.cos(azi1);
			return p;
		}
	}
}
function inverse$8(p) {
	p.x -= this.x0;
	p.y -= this.y0;
	var rh, z, sinz, cosz, lon, lat, con, e0, e1, e2, e3, Mlp, M, azi1, s12, vars;
	if (this.sphere) {
		rh = Math.sqrt(p.x * p.x + p.y * p.y);
		if (rh > 2 * HALF_PI * this.a) return;
		z = rh / this.a;
		sinz = Math.sin(z);
		cosz = Math.cos(z);
		lon = this.long0;
		if (Math.abs(rh) <= 1e-10) lat = this.lat0;
		else {
			lat = asinz_default(cosz * this.sin_p12 + p.y * sinz * this.cos_p12 / rh);
			con = Math.abs(this.lat0) - HALF_PI;
			if (Math.abs(con) <= 1e-10) if (this.lat0 >= 0) lon = adjust_lon_default(this.long0 + Math.atan2(p.x, -p.y), this.over);
			else lon = adjust_lon_default(this.long0 - Math.atan2(-p.x, p.y), this.over);
			else lon = adjust_lon_default(this.long0 + Math.atan2(p.x * sinz, rh * this.cos_p12 * cosz - p.y * this.sin_p12 * sinz), this.over);
		}
		p.x = lon;
		p.y = lat;
		return p;
	} else {
		e0 = e0fn_default(this.es);
		e1 = e1fn_default(this.es);
		e2 = e2fn_default(this.es);
		e3 = e3fn_default(this.es);
		if (Math.abs(this.sin_p12 - 1) <= 1e-10) {
			Mlp = this.a * mlfn_default(e0, e1, e2, e3, HALF_PI);
			rh = Math.sqrt(p.x * p.x + p.y * p.y);
			M = Mlp - rh;
			lat = imlfn_default(M / this.a, e0, e1, e2, e3);
			lon = adjust_lon_default(this.long0 + Math.atan2(p.x, -1 * p.y), this.over);
			p.x = lon;
			p.y = lat;
			return p;
		} else if (Math.abs(this.sin_p12 + 1) <= 1e-10) {
			Mlp = this.a * mlfn_default(e0, e1, e2, e3, HALF_PI);
			rh = Math.sqrt(p.x * p.x + p.y * p.y);
			M = rh - Mlp;
			lat = imlfn_default(M / this.a, e0, e1, e2, e3);
			lon = adjust_lon_default(this.long0 + Math.atan2(p.x, p.y), this.over);
			p.x = lon;
			p.y = lat;
			return p;
		} else {
			azi1 = Math.atan2(p.x, p.y);
			s12 = Math.sqrt(p.x * p.x + p.y * p.y);
			vars = vincentyDirect(this.lat0, this.long0, azi1, s12, this.a, this.f);
			p.x = vars.lon2;
			p.y = vars.lat2;
			return p;
		}
	}
}
var aeqd_default = {
	init: init$9,
	forward: forward$8,
	inverse: inverse$8,
	names: ["Azimuthal_Equidistant", "aeqd"]
};
//#endregion
//#region node_modules/proj4/lib/projections/ortho.js
/**
* @typedef {Object} LocalThis
* @property {number} sin_p14
* @property {number} cos_p14
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$8() {
	this.sin_p14 = Math.sin(this.lat0 || 0);
	this.cos_p14 = Math.cos(this.lat0 || 0);
}
function forward$7(p) {
	var sinphi, cosphi;
	var dlon;
	var coslon;
	var ksp;
	var g, x, y;
	var lon = p.x;
	var lat = p.y;
	dlon = adjust_lon_default(lon - (this.long0 || 0), this.over);
	sinphi = Math.sin(lat);
	cosphi = Math.cos(lat);
	coslon = Math.cos(dlon);
	g = this.sin_p14 * sinphi + this.cos_p14 * cosphi * coslon;
	ksp = 1;
	if (g > 0 || Math.abs(g) <= 1e-10) {
		x = (this.x0 || 0) + this.a * ksp * cosphi * Math.sin(dlon);
		y = (this.y0 || 0) + this.a * ksp * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon);
	}
	p.x = x;
	p.y = y;
	return p;
}
function inverse$7(p) {
	var rh;
	var z;
	var sinz, cosz;
	var con;
	var lon, lat;
	var long0, lat0;
	p.x -= this.x0 || 0;
	p.y -= this.y0 || 0;
	rh = Math.sqrt(p.x * p.x + p.y * p.y);
	z = asinz_default(rh / this.a);
	sinz = Math.sin(z);
	cosz = Math.cos(z);
	long0 = this.long0 || 0;
	lat0 = this.lat0 || 0;
	lon = long0;
	if (Math.abs(rh) <= 1e-10) {
		lat = lat0;
		p.x = lon;
		p.y = lat;
		return p;
	}
	lat = asinz_default(cosz * this.sin_p14 + p.y * sinz * this.cos_p14 / rh);
	con = Math.abs(lat0) - HALF_PI;
	if (Math.abs(con) <= 1e-10) {
		if (lat0 >= 0) lon = adjust_lon_default(long0 + Math.atan2(p.x, -p.y), this.over);
		else lon = adjust_lon_default(long0 - Math.atan2(-p.x, p.y), this.over);
		p.x = lon;
		p.y = lat;
		return p;
	}
	lon = adjust_lon_default(long0 + Math.atan2(p.x * sinz, rh * this.cos_p14 * cosz - p.y * this.sin_p14 * sinz), this.over);
	p.x = lon;
	p.y = lat;
	return p;
}
var ortho_default = {
	init: init$8,
	forward: forward$7,
	inverse: inverse$7,
	names: ["ortho"]
};
//#endregion
//#region node_modules/proj4/lib/projections/qsc.js
/**
* @typedef {Object} LocalThis
* @property {number} face
* @property {number} x0
* @property {number} y0
* @property {number} es
* @property {number} one_minus_f
* @property {number} one_minus_f_squared
*/
var FACE_ENUM = {
	FRONT: 1,
	RIGHT: 2,
	BACK: 3,
	LEFT: 4,
	TOP: 5,
	BOTTOM: 6
};
var AREA_ENUM = {
	AREA_0: 1,
	AREA_1: 2,
	AREA_2: 3,
	AREA_3: 4
};
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$7() {
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.lat0 = this.lat0 || 0;
	this.long0 = this.long0 || 0;
	this.lat_ts = this.lat_ts || 0;
	this.title = this.title || "Quadrilateralized Spherical Cube";
	if (this.lat0 >= HALF_PI - FORTPI / 2) this.face = FACE_ENUM.TOP;
	else if (this.lat0 <= -(HALF_PI - FORTPI / 2)) this.face = FACE_ENUM.BOTTOM;
	else if (Math.abs(this.long0) <= FORTPI) this.face = FACE_ENUM.FRONT;
	else if (Math.abs(this.long0) <= HALF_PI + FORTPI) this.face = this.long0 > 0 ? FACE_ENUM.RIGHT : FACE_ENUM.LEFT;
	else this.face = FACE_ENUM.BACK;
	if (this.es !== 0) {
		this.one_minus_f = 1 - (this.a - this.b) / this.a;
		this.one_minus_f_squared = this.one_minus_f * this.one_minus_f;
	}
}
function forward$6(p) {
	var xy = {
		x: 0,
		y: 0
	};
	var lat, lon;
	var theta, phi;
	var t, mu;
	var area = { value: 0 };
	p.x -= this.long0;
	if (this.es !== 0) lat = Math.atan(this.one_minus_f_squared * Math.tan(p.y));
	else lat = p.y;
	lon = p.x;
	if (this.face === FACE_ENUM.TOP) {
		phi = HALF_PI - lat;
		if (lon >= FORTPI && lon <= HALF_PI + FORTPI) {
			area.value = AREA_ENUM.AREA_0;
			theta = lon - HALF_PI;
		} else if (lon > HALF_PI + FORTPI || lon <= -(HALF_PI + FORTPI)) {
			area.value = AREA_ENUM.AREA_1;
			theta = lon > 0 ? lon - SPI : lon + SPI;
		} else if (lon > -(HALF_PI + FORTPI) && lon <= -FORTPI) {
			area.value = AREA_ENUM.AREA_2;
			theta = lon + HALF_PI;
		} else {
			area.value = AREA_ENUM.AREA_3;
			theta = lon;
		}
	} else if (this.face === FACE_ENUM.BOTTOM) {
		phi = HALF_PI + lat;
		if (lon >= FORTPI && lon <= HALF_PI + FORTPI) {
			area.value = AREA_ENUM.AREA_0;
			theta = -lon + HALF_PI;
		} else if (lon < FORTPI && lon >= -FORTPI) {
			area.value = AREA_ENUM.AREA_1;
			theta = -lon;
		} else if (lon < -FORTPI && lon >= -(HALF_PI + FORTPI)) {
			area.value = AREA_ENUM.AREA_2;
			theta = -lon - HALF_PI;
		} else {
			area.value = AREA_ENUM.AREA_3;
			theta = lon > 0 ? -lon + SPI : -lon - SPI;
		}
	} else {
		var q, r, s;
		var sinlat, coslat;
		var sinlon, coslon;
		if (this.face === FACE_ENUM.RIGHT) lon = qsc_shift_lon_origin(lon, +HALF_PI);
		else if (this.face === FACE_ENUM.BACK) lon = qsc_shift_lon_origin(lon, +SPI);
		else if (this.face === FACE_ENUM.LEFT) lon = qsc_shift_lon_origin(lon, -HALF_PI);
		sinlat = Math.sin(lat);
		coslat = Math.cos(lat);
		sinlon = Math.sin(lon);
		coslon = Math.cos(lon);
		q = coslat * coslon;
		r = coslat * sinlon;
		s = sinlat;
		if (this.face === FACE_ENUM.FRONT) {
			phi = Math.acos(q);
			theta = qsc_fwd_equat_face_theta(phi, s, r, area);
		} else if (this.face === FACE_ENUM.RIGHT) {
			phi = Math.acos(r);
			theta = qsc_fwd_equat_face_theta(phi, s, -q, area);
		} else if (this.face === FACE_ENUM.BACK) {
			phi = Math.acos(-q);
			theta = qsc_fwd_equat_face_theta(phi, s, -r, area);
		} else if (this.face === FACE_ENUM.LEFT) {
			phi = Math.acos(-r);
			theta = qsc_fwd_equat_face_theta(phi, s, q, area);
		} else {
			phi = theta = 0;
			area.value = AREA_ENUM.AREA_0;
		}
	}
	mu = Math.atan(12 / SPI * (theta + Math.acos(Math.sin(theta) * Math.cos(FORTPI)) - HALF_PI));
	t = Math.sqrt((1 - Math.cos(phi)) / (Math.cos(mu) * Math.cos(mu)) / (1 - Math.cos(Math.atan(1 / Math.cos(theta)))));
	if (area.value === AREA_ENUM.AREA_1) mu += HALF_PI;
	else if (area.value === AREA_ENUM.AREA_2) mu += SPI;
	else if (area.value === AREA_ENUM.AREA_3) mu += 1.5 * SPI;
	xy.x = t * Math.cos(mu);
	xy.y = t * Math.sin(mu);
	xy.x = xy.x * this.a + this.x0;
	xy.y = xy.y * this.a + this.y0;
	p.x = xy.x;
	p.y = xy.y;
	return p;
}
function inverse$6(p) {
	var lp = {
		lam: 0,
		phi: 0
	};
	var mu, nu, cosmu, tannu;
	var tantheta, theta, cosphi, phi;
	var t;
	var area = { value: 0 };
	p.x = (p.x - this.x0) / this.a;
	p.y = (p.y - this.y0) / this.a;
	nu = Math.atan(Math.sqrt(p.x * p.x + p.y * p.y));
	mu = Math.atan2(p.y, p.x);
	if (p.x >= 0 && p.x >= Math.abs(p.y)) area.value = AREA_ENUM.AREA_0;
	else if (p.y >= 0 && p.y >= Math.abs(p.x)) {
		area.value = AREA_ENUM.AREA_1;
		mu -= HALF_PI;
	} else if (p.x < 0 && -p.x >= Math.abs(p.y)) {
		area.value = AREA_ENUM.AREA_2;
		mu = mu < 0 ? mu + SPI : mu - SPI;
	} else {
		area.value = AREA_ENUM.AREA_3;
		mu += HALF_PI;
	}
	t = SPI / 12 * Math.tan(mu);
	tantheta = Math.sin(t) / (Math.cos(t) - 1 / Math.sqrt(2));
	theta = Math.atan(tantheta);
	cosmu = Math.cos(mu);
	tannu = Math.tan(nu);
	cosphi = 1 - cosmu * cosmu * tannu * tannu * (1 - Math.cos(Math.atan(1 / Math.cos(theta))));
	if (cosphi < -1) cosphi = -1;
	else if (cosphi > 1) cosphi = 1;
	if (this.face === FACE_ENUM.TOP) {
		phi = Math.acos(cosphi);
		lp.phi = HALF_PI - phi;
		if (area.value === AREA_ENUM.AREA_0) lp.lam = theta + HALF_PI;
		else if (area.value === AREA_ENUM.AREA_1) lp.lam = theta < 0 ? theta + SPI : theta - SPI;
		else if (area.value === AREA_ENUM.AREA_2) lp.lam = theta - HALF_PI;
		else lp.lam = theta;
	} else if (this.face === FACE_ENUM.BOTTOM) {
		phi = Math.acos(cosphi);
		lp.phi = phi - HALF_PI;
		if (area.value === AREA_ENUM.AREA_0) lp.lam = -theta + HALF_PI;
		else if (area.value === AREA_ENUM.AREA_1) lp.lam = -theta;
		else if (area.value === AREA_ENUM.AREA_2) lp.lam = -theta - HALF_PI;
		else lp.lam = theta < 0 ? -theta - SPI : -theta + SPI;
	} else {
		var q = cosphi, r, s;
		t = q * q;
		if (t >= 1) s = 0;
		else s = Math.sqrt(1 - t) * Math.sin(theta);
		t += s * s;
		if (t >= 1) r = 0;
		else r = Math.sqrt(1 - t);
		if (area.value === AREA_ENUM.AREA_1) {
			t = r;
			r = -s;
			s = t;
		} else if (area.value === AREA_ENUM.AREA_2) {
			r = -r;
			s = -s;
		} else if (area.value === AREA_ENUM.AREA_3) {
			t = r;
			r = s;
			s = -t;
		}
		if (this.face === FACE_ENUM.RIGHT) {
			t = q;
			q = -r;
			r = t;
		} else if (this.face === FACE_ENUM.BACK) {
			q = -q;
			r = -r;
		} else if (this.face === FACE_ENUM.LEFT) {
			t = q;
			q = r;
			r = -t;
		}
		lp.phi = Math.acos(-s) - HALF_PI;
		lp.lam = Math.atan2(r, q);
		if (this.face === FACE_ENUM.RIGHT) lp.lam = qsc_shift_lon_origin(lp.lam, -HALF_PI);
		else if (this.face === FACE_ENUM.BACK) lp.lam = qsc_shift_lon_origin(lp.lam, -SPI);
		else if (this.face === FACE_ENUM.LEFT) lp.lam = qsc_shift_lon_origin(lp.lam, +HALF_PI);
	}
	if (this.es !== 0) {
		var invert_sign;
		var tanphi, xa;
		invert_sign = lp.phi < 0 ? 1 : 0;
		tanphi = Math.tan(lp.phi);
		xa = this.b / Math.sqrt(tanphi * tanphi + this.one_minus_f_squared);
		lp.phi = Math.atan(Math.sqrt(this.a * this.a - xa * xa) / (this.one_minus_f * xa));
		if (invert_sign) lp.phi = -lp.phi;
	}
	lp.lam += this.long0;
	p.x = lp.lam;
	p.y = lp.phi;
	return p;
}
function qsc_fwd_equat_face_theta(phi, y, x, area) {
	var theta;
	if (phi < 1e-10) {
		area.value = AREA_ENUM.AREA_0;
		theta = 0;
	} else {
		theta = Math.atan2(y, x);
		if (Math.abs(theta) <= FORTPI) area.value = AREA_ENUM.AREA_0;
		else if (theta > FORTPI && theta <= HALF_PI + FORTPI) {
			area.value = AREA_ENUM.AREA_1;
			theta -= HALF_PI;
		} else if (theta > HALF_PI + FORTPI || theta <= -(HALF_PI + FORTPI)) {
			area.value = AREA_ENUM.AREA_2;
			theta = theta >= 0 ? theta - SPI : theta + SPI;
		} else {
			area.value = AREA_ENUM.AREA_3;
			theta += HALF_PI;
		}
	}
	return theta;
}
function qsc_shift_lon_origin(lon, offset) {
	var slon = lon + offset;
	if (slon < -3.14159265359) slon += TWO_PI;
	else if (slon > 3.14159265359) slon -= TWO_PI;
	return slon;
}
var qsc_default = {
	init: init$7,
	forward: forward$6,
	inverse: inverse$6,
	names: [
		"Quadrilateralized Spherical Cube",
		"Quadrilateralized_Spherical_Cube",
		"qsc"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/robin.js
var COEFS_X = [
	[
		1,
		22199e-21,
		-715515e-10,
		31103e-10
	],
	[
		.9986,
		-482243e-9,
		-24897e-9,
		-13309e-10
	],
	[
		.9954,
		-83103e-8,
		-448605e-10,
		-9.86701e-7
	],
	[
		.99,
		-.00135364,
		-59661e-9,
		36777e-10
	],
	[
		.9822,
		-.00167442,
		-449547e-11,
		-572411e-11
	],
	[
		.973,
		-.00214868,
		-903571e-10,
		1.8736e-8
	],
	[
		.96,
		-.00305085,
		-900761e-10,
		164917e-11
	],
	[
		.9427,
		-.00382792,
		-653386e-10,
		-26154e-10
	],
	[
		.9216,
		-.00467746,
		-10457e-8,
		481243e-11
	],
	[
		.8962,
		-.00536223,
		-323831e-10,
		-543432e-11
	],
	[
		.8679,
		-.00609363,
		-113898e-9,
		332484e-11
	],
	[
		.835,
		-.00698325,
		-640253e-10,
		9.34959e-7
	],
	[
		.7986,
		-.00755338,
		-500009e-10,
		9.35324e-7
	],
	[
		.7597,
		-.00798324,
		-35971e-9,
		-227626e-11
	],
	[
		.7186,
		-.00851367,
		-701149e-10,
		-86303e-10
	],
	[
		.6732,
		-.00986209,
		-199569e-9,
		191974e-10
	],
	[
		.6213,
		-.010418,
		883923e-10,
		624051e-11
	],
	[
		.5722,
		-.00906601,
		182e-6,
		624051e-11
	],
	[
		.5322,
		-.00677797,
		275608e-9,
		624051e-11
	]
];
var COEFS_Y = [
	[
		-520417e-23,
		.0124,
		121431e-23,
		-845284e-16
	],
	[
		.062,
		.0124,
		-1.26793e-9,
		422642e-15
	],
	[
		.124,
		.0124,
		5.07171e-9,
		-1.60604e-9
	],
	[
		.186,
		.0123999,
		-1.90189e-8,
		6.00152e-9
	],
	[
		.248,
		.0124002,
		7.10039e-8,
		-2.24e-8
	],
	[
		.31,
		.0123992,
		-2.64997e-7,
		8.35986e-8
	],
	[
		.372,
		.0124029,
		9.88983e-7,
		-3.11994e-7
	],
	[
		.434,
		.0123893,
		-369093e-11,
		-4.35621e-7
	],
	[
		.4958,
		.0123198,
		-102252e-10,
		-3.45523e-7
	],
	[
		.5571,
		.0121916,
		-154081e-10,
		-5.82288e-7
	],
	[
		.6176,
		.0119938,
		-241424e-10,
		-5.25327e-7
	],
	[
		.6769,
		.011713,
		-320223e-10,
		-5.16405e-7
	],
	[
		.7346,
		.0113541,
		-397684e-10,
		-6.09052e-7
	],
	[
		.7903,
		.0109107,
		-489042e-10,
		-104739e-11
	],
	[
		.8435,
		.0103431,
		-64615e-9,
		-1.40374e-9
	],
	[
		.8936,
		.00969686,
		-64636e-9,
		-8547e-9
	],
	[
		.9394,
		.00840947,
		-192841e-9,
		-42106e-10
	],
	[
		.9761,
		.00616527,
		-256e-6,
		-42106e-10
	],
	[
		1,
		.00328947,
		-319159e-9,
		-42106e-10
	]
];
var FXC = .8487;
var FYC = 1.3523;
var C1 = R2D / 5;
var RC1 = 1 / C1;
var NODES = 18;
var poly3_val = function(coefs, x) {
	return coefs[0] + x * (coefs[1] + x * (coefs[2] + x * coefs[3]));
};
var poly3_der = function(coefs, x) {
	return coefs[1] + x * (2 * coefs[2] + x * 3 * coefs[3]);
};
function newton_rapshon(f_df, start, max_err, iters) {
	var x = start;
	for (; iters; --iters) {
		var upd = f_df(x);
		x -= upd;
		if (Math.abs(upd) < max_err) break;
	}
	return x;
}
function init$6() {
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.long0 = this.long0 || 0;
	this.es = 0;
	this.title = this.title || "Robinson";
}
function forward$5(ll) {
	var lon = adjust_lon_default(ll.x - this.long0, this.over);
	var dphi = Math.abs(ll.y);
	var i = Math.floor(dphi * C1);
	if (i < 0) i = 0;
	else if (i >= NODES) i = NODES - 1;
	dphi = R2D * (dphi - RC1 * i);
	var xy = {
		x: poly3_val(COEFS_X[i], dphi) * lon,
		y: poly3_val(COEFS_Y[i], dphi)
	};
	if (ll.y < 0) xy.y = -xy.y;
	xy.x = xy.x * this.a * FXC + this.x0;
	xy.y = xy.y * this.a * FYC + this.y0;
	if (ll.z !== void 0) xy.z = ll.z;
	if (ll.m !== void 0) xy.m = ll.m;
	return xy;
}
function inverse$5(xy) {
	var ll = {
		x: (xy.x - this.x0) / (this.a * FXC),
		y: Math.abs(xy.y - this.y0) / (this.a * FYC)
	};
	if (ll.y >= 1) {
		ll.x /= COEFS_X[NODES][0];
		ll.y = xy.y < 0 ? -HALF_PI : HALF_PI;
	} else {
		var i = Math.floor(ll.y * NODES);
		if (i < 0) i = 0;
		else if (i >= NODES) i = NODES - 1;
		for (;;) if (COEFS_Y[i][0] > ll.y) --i;
		else if (COEFS_Y[i + 1][0] <= ll.y) ++i;
		else break;
		var coefs = COEFS_Y[i];
		var t = 5 * (ll.y - coefs[0]) / (COEFS_Y[i + 1][0] - coefs[0]);
		t = newton_rapshon(function(x) {
			return (poly3_val(coefs, x) - ll.y) / poly3_der(coefs, x);
		}, t, EPSLN, 100);
		ll.x /= poly3_val(COEFS_X[i], t);
		ll.y = (5 * i + t) * D2R$1;
		if (xy.y < 0) ll.y = -ll.y;
	}
	ll.x = adjust_lon_default(ll.x + this.long0, this.over);
	if (xy.z !== void 0) ll.z = xy.z;
	if (xy.m !== void 0) ll.m = xy.m;
	return ll;
}
var robin_default = {
	init: init$6,
	forward: forward$5,
	inverse: inverse$5,
	names: ["Robinson", "robin"]
};
//#endregion
//#region node_modules/proj4/lib/projections/geocent.js
function init$5() {
	this.name = "geocent";
}
function forward$4(p) {
	return geodeticToGeocentric(p, this.es, this.a);
}
function inverse$4(p) {
	return geocentricToGeodetic(p, this.es, this.a, this.b);
}
var geocent_default = {
	init: init$5,
	forward: forward$4,
	inverse: inverse$4,
	names: [
		"Geocentric",
		"geocentric",
		"geocent",
		"Geocent"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/tpers.js
/**
* @typedef {Object} LocalThis
* @property {number} mode
* @property {number} sinph0
* @property {number} cosph0
* @property {number} pn1
* @property {number} h
* @property {number} rp
* @property {number} p
* @property {number} h1
* @property {number} pfact
* @property {number} es
* @property {number} tilt
* @property {number} azi
* @property {number} cg
* @property {number} sg
* @property {number} cw
* @property {number} sw
*/
var mode = {
	N_POLE: 0,
	S_POLE: 1,
	EQUIT: 2,
	OBLIQ: 3
};
var params = {
	h: {
		def: 1e5,
		num: true
	},
	azi: {
		def: 0,
		num: true,
		degrees: true
	},
	tilt: {
		def: 0,
		num: true,
		degrees: true
	},
	long0: {
		def: 0,
		num: true
	},
	lat0: {
		def: 0,
		num: true
	}
};
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$4() {
	Object.keys(params).forEach(function(p) {
		if (typeof this[p] === "undefined") this[p] = params[p].def;
		else if (params[p].num && isNaN(this[p])) throw new Error("Invalid parameter value, must be numeric " + p + " = " + this[p]);
		else if (params[p].num) this[p] = parseFloat(this[p]);
		if (params[p].degrees) this[p] = this[p] * D2R$1;
	}.bind(this));
	if (Math.abs(Math.abs(this.lat0) - HALF_PI) < 1e-10) this.mode = this.lat0 < 0 ? mode.S_POLE : mode.N_POLE;
	else if (Math.abs(this.lat0) < 1e-10) this.mode = mode.EQUIT;
	else {
		this.mode = mode.OBLIQ;
		this.sinph0 = Math.sin(this.lat0);
		this.cosph0 = Math.cos(this.lat0);
	}
	this.pn1 = this.h / this.a;
	if (this.pn1 <= 0 || this.pn1 > 1e10) throw new Error("Invalid height");
	this.p = 1 + this.pn1;
	this.rp = 1 / this.p;
	this.h1 = 1 / this.pn1;
	this.pfact = (this.p + 1) * this.h1;
	this.es = 0;
	var omega = this.tilt;
	var gamma = this.azi;
	this.cg = Math.cos(gamma);
	this.sg = Math.sin(gamma);
	this.cw = Math.cos(omega);
	this.sw = Math.sin(omega);
}
function forward$3(p) {
	p.x -= this.long0;
	var sinphi = Math.sin(p.y);
	var cosphi = Math.cos(p.y);
	var coslam = Math.cos(p.x);
	var x, y;
	switch (this.mode) {
		case mode.OBLIQ:
			y = this.sinph0 * sinphi + this.cosph0 * cosphi * coslam;
			break;
		case mode.EQUIT:
			y = cosphi * coslam;
			break;
		case mode.S_POLE:
			y = -sinphi;
			break;
		case mode.N_POLE:
			y = sinphi;
			break;
	}
	y = this.pn1 / (this.p - y);
	x = y * cosphi * Math.sin(p.x);
	switch (this.mode) {
		case mode.OBLIQ:
			y *= this.cosph0 * sinphi - this.sinph0 * cosphi * coslam;
			break;
		case mode.EQUIT:
			y *= sinphi;
			break;
		case mode.N_POLE:
			y *= -(cosphi * coslam);
			break;
		case mode.S_POLE:
			y *= cosphi * coslam;
			break;
	}
	var yt = y * this.cg + x * this.sg, ba = 1 / (yt * this.sw * this.h1 + this.cw);
	x = (x * this.cg - y * this.sg) * this.cw * ba;
	y = yt * ba;
	p.x = x * this.a;
	p.y = y * this.a;
	return p;
}
function inverse$3(p) {
	p.x /= this.a;
	p.y /= this.a;
	var r = {
		x: p.x,
		y: p.y
	};
	var bm, bq, yt = 1 / (this.pn1 - p.y * this.sw);
	bm = this.pn1 * p.x * yt;
	bq = this.pn1 * p.y * this.cw * yt;
	p.x = bm * this.cg + bq * this.sg;
	p.y = bq * this.cg - bm * this.sg;
	var rh = hypot_default(p.x, p.y);
	if (Math.abs(rh) < 1e-10) {
		r.x = 0;
		r.y = p.y;
	} else {
		var cosz, sinz = 1 - rh * rh * this.pfact;
		sinz = (this.p - Math.sqrt(sinz)) / (this.pn1 / rh + rh / this.pn1);
		cosz = Math.sqrt(1 - sinz * sinz);
		switch (this.mode) {
			case mode.OBLIQ:
				r.y = Math.asin(cosz * this.sinph0 + p.y * sinz * this.cosph0 / rh);
				p.y = (cosz - this.sinph0 * Math.sin(r.y)) * rh;
				p.x *= sinz * this.cosph0;
				break;
			case mode.EQUIT:
				r.y = Math.asin(p.y * sinz / rh);
				p.y = cosz * rh;
				p.x *= sinz;
				break;
			case mode.N_POLE:
				r.y = Math.asin(cosz);
				p.y = -p.y;
				break;
			case mode.S_POLE:
				r.y = -Math.asin(cosz);
				break;
		}
		r.x = Math.atan2(p.x, p.y);
	}
	p.x = r.x + this.long0;
	p.y = r.y;
	return p;
}
var tpers_default = {
	init: init$4,
	forward: forward$3,
	inverse: inverse$3,
	names: ["Tilted_Perspective", "tpers"]
};
//#endregion
//#region node_modules/proj4/lib/projections/geos.js
/**
* @typedef {Object} LocalThis
* @property {1 | 0} flip_axis
* @property {number} h
* @property {number} radius_g_1
* @property {number} radius_g
* @property {number} radius_p
* @property {number} radius_p2
* @property {number} radius_p_inv2
* @property {'ellipse'|'sphere'} shape
* @property {number} C
* @property {string} sweep
* @property {number} es
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$3() {
	this.flip_axis = this.sweep === "x" ? 1 : 0;
	this.h = Number(this.h);
	this.radius_g_1 = this.h / this.a;
	if (this.radius_g_1 <= 0 || this.radius_g_1 > 1e10) throw new Error();
	this.radius_g = 1 + this.radius_g_1;
	this.C = this.radius_g * this.radius_g - 1;
	if (this.es !== 0) {
		var one_es = 1 - this.es;
		var rone_es = 1 / one_es;
		this.radius_p = Math.sqrt(one_es);
		this.radius_p2 = one_es;
		this.radius_p_inv2 = rone_es;
		this.shape = "ellipse";
	} else {
		this.radius_p = 1;
		this.radius_p2 = 1;
		this.radius_p_inv2 = 1;
		this.shape = "sphere";
	}
	if (!this.title) this.title = "Geostationary Satellite View";
}
function forward$2(p) {
	var lon = p.x;
	var lat = p.y;
	var tmp, v_x, v_y, v_z;
	lon = lon - this.long0;
	if (this.shape === "ellipse") {
		lat = Math.atan(this.radius_p2 * Math.tan(lat));
		var r = this.radius_p / hypot_default(this.radius_p * Math.cos(lat), Math.sin(lat));
		v_x = r * Math.cos(lon) * Math.cos(lat);
		v_y = r * Math.sin(lon) * Math.cos(lat);
		v_z = r * Math.sin(lat);
		if ((this.radius_g - v_x) * v_x - v_y * v_y - v_z * v_z * this.radius_p_inv2 < 0) {
			p.x = NaN;
			p.y = NaN;
			return p;
		}
		tmp = this.radius_g - v_x;
		if (this.flip_axis) {
			p.x = this.radius_g_1 * Math.atan(v_y / hypot_default(v_z, tmp));
			p.y = this.radius_g_1 * Math.atan(v_z / tmp);
		} else {
			p.x = this.radius_g_1 * Math.atan(v_y / tmp);
			p.y = this.radius_g_1 * Math.atan(v_z / hypot_default(v_y, tmp));
		}
	} else if (this.shape === "sphere") {
		tmp = Math.cos(lat);
		v_x = Math.cos(lon) * tmp;
		v_y = Math.sin(lon) * tmp;
		v_z = Math.sin(lat);
		tmp = this.radius_g - v_x;
		if (this.flip_axis) {
			p.x = this.radius_g_1 * Math.atan(v_y / hypot_default(v_z, tmp));
			p.y = this.radius_g_1 * Math.atan(v_z / tmp);
		} else {
			p.x = this.radius_g_1 * Math.atan(v_y / tmp);
			p.y = this.radius_g_1 * Math.atan(v_z / hypot_default(v_y, tmp));
		}
	}
	p.x = p.x * this.a;
	p.y = p.y * this.a;
	return p;
}
function inverse$2(p) {
	var v_x = -1;
	var v_y = 0;
	var v_z = 0;
	var a, b, det, k;
	p.x = p.x / this.a;
	p.y = p.y / this.a;
	if (this.shape === "ellipse") {
		if (this.flip_axis) {
			v_z = Math.tan(p.y / this.radius_g_1);
			v_y = Math.tan(p.x / this.radius_g_1) * hypot_default(1, v_z);
		} else {
			v_y = Math.tan(p.x / this.radius_g_1);
			v_z = Math.tan(p.y / this.radius_g_1) * hypot_default(1, v_y);
		}
		var v_zp = v_z / this.radius_p;
		a = v_y * v_y + v_zp * v_zp + v_x * v_x;
		b = 2 * this.radius_g * v_x;
		det = b * b - 4 * a * this.C;
		if (det < 0) {
			p.x = NaN;
			p.y = NaN;
			return p;
		}
		k = (-b - Math.sqrt(det)) / (2 * a);
		v_x = this.radius_g + k * v_x;
		v_y *= k;
		v_z *= k;
		p.x = Math.atan2(v_y, v_x);
		p.y = Math.atan(v_z * Math.cos(p.x) / v_x);
		p.y = Math.atan(this.radius_p_inv2 * Math.tan(p.y));
	} else if (this.shape === "sphere") {
		if (this.flip_axis) {
			v_z = Math.tan(p.y / this.radius_g_1);
			v_y = Math.tan(p.x / this.radius_g_1) * Math.sqrt(1 + v_z * v_z);
		} else {
			v_y = Math.tan(p.x / this.radius_g_1);
			v_z = Math.tan(p.y / this.radius_g_1) * Math.sqrt(1 + v_y * v_y);
		}
		a = v_y * v_y + v_z * v_z + v_x * v_x;
		b = 2 * this.radius_g * v_x;
		det = b * b - 4 * a * this.C;
		if (det < 0) {
			p.x = NaN;
			p.y = NaN;
			return p;
		}
		k = (-b - Math.sqrt(det)) / (2 * a);
		v_x = this.radius_g + k * v_x;
		v_y *= k;
		v_z *= k;
		p.x = Math.atan2(v_y, v_x);
		p.y = Math.atan(v_z * Math.cos(p.x) / v_x);
	}
	p.x = p.x + this.long0;
	return p;
}
var geos_default = {
	init: init$3,
	forward: forward$2,
	inverse: inverse$2,
	names: [
		"Geostationary Satellite View",
		"Geostationary_Satellite",
		"geos"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/eqearth.js
/**
* Copyright 2018 Bernie Jenny, Monash University, Melbourne, Australia.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Equal Earth is a projection inspired by the Robinson projection, but unlike
* the Robinson projection retains the relative size of areas. The projection
* was designed in 2018 by Bojan Savric, Tom Patterson and Bernhard Jenny.
*
* Publication:
* Bojan Savric, Tom Patterson & Bernhard Jenny (2018). The Equal Earth map
* projection, International Journal of Geographical Information Science,
* DOI: 10.1080/13658816.2018.1504949
*
* Code released August 2018
* Ported to JavaScript and adapted for mapshaper-proj by Matthew Bloch August 2018
* Modified for proj4js by Andreas Hocevar by Andreas Hocevar March 2024
*/
var A1 = 1.340264, A2 = -.081106, A3 = 893e-6, A4 = .003796, M = Math.sqrt(3) / 2;
/**
* @typedef {Object} LocalThis
* @property {number} es
* @property {number} e
* @property {Array<number>} apa
* @property {number} qp
* @property {number} rqda
*/
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$2() {
	this.long0 = this.long0 !== void 0 ? this.long0 : 0;
	this.x0 = this.x0 !== void 0 ? this.x0 : 0;
	this.y0 = this.y0 !== void 0 ? this.y0 : 0;
	if (this.es !== 0) {
		this.apa = authset(this.es);
		this.qp = qsfnz_default(this.e, 1);
		this.rqda = Math.sqrt(.5 * this.qp);
	}
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function forward$1(p) {
	var lam = adjust_lon_default(p.x - this.long0, this.over);
	var phi = p.y;
	var sinphi = Math.sin(phi);
	if (this.es !== 0) sinphi = qsfnz_default(this.e, sinphi) / this.qp;
	var paramLat = Math.asin(M * sinphi), paramLatSq = paramLat * paramLat, paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
	p.x = lam * Math.cos(paramLat) / (M * (A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq)));
	p.y = paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq));
	if (this.es !== 0) {
		p.x *= this.rqda;
		p.y *= this.rqda;
	}
	p.x = this.a * p.x + this.x0;
	p.y = this.a * p.y + this.y0;
	return p;
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function inverse$1(p) {
	p.x = (p.x - this.x0) / this.a;
	p.y = (p.y - this.y0) / this.a;
	if (this.es !== 0) {
		p.x /= this.rqda;
		p.y /= this.rqda;
	}
	var EPS = 1e-9, NITER = 12, paramLat = p.y, paramLatSq, paramLatPow6, fy, fpy, dlat, i;
	for (i = 0; i < NITER; ++i) {
		paramLatSq = paramLat * paramLat;
		paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
		fy = paramLat * (A1 + A2 * paramLatSq + paramLatPow6 * (A3 + A4 * paramLatSq)) - p.y;
		fpy = A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq);
		paramLat -= dlat = fy / fpy;
		if (Math.abs(dlat) < EPS) break;
	}
	paramLatSq = paramLat * paramLat;
	paramLatPow6 = paramLatSq * paramLatSq * paramLatSq;
	p.x = M * p.x * (A1 + 3 * A2 * paramLatSq + paramLatPow6 * (7 * A3 + 9 * A4 * paramLatSq)) / Math.cos(paramLat);
	p.y = Math.asin(Math.sin(paramLat) / M);
	if (this.es !== 0) p.y = authlat(p.y, this.apa);
	p.x = adjust_lon_default(p.x + this.long0, this.over);
	return p;
}
var eqearth_default = {
	init: init$2,
	forward: forward$1,
	inverse: inverse$1,
	names: [
		"eqearth",
		"Equal Earth",
		"Equal_Earth"
	]
};
//#endregion
//#region node_modules/proj4/lib/projections/bonne.js
/**
* @typedef {Object} LocalThis
* @property {number} phi1
* @property {number} cphi1
* @property {number} es
* @property {Array<number>} en
* @property {number} m1
* @property {number} am1
*/
var EPS10 = 1e-10;
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init$1() {
	var c;
	this.phi1 = this.lat1;
	if (Math.abs(this.phi1) < EPS10) throw new Error();
	if (this.es) {
		this.en = pj_enfn_default(this.es);
		this.m1 = pj_mlfn_default(this.phi1, this.am1 = Math.sin(this.phi1), c = Math.cos(this.phi1), this.en);
		this.am1 = c / (Math.sqrt(1 - this.es * this.am1 * this.am1) * this.am1);
		this.inverse = e_inv;
		this.forward = e_fwd;
	} else {
		if (Math.abs(this.phi1) + EPS10 >= HALF_PI) this.cphi1 = 0;
		else this.cphi1 = 1 / Math.tan(this.phi1);
		this.inverse = s_inv;
		this.forward = s_fwd;
	}
}
function e_fwd(p) {
	var lam = adjust_lon_default(p.x - (this.long0 || 0), this.over);
	var phi = p.y;
	var rh = this.am1 + this.m1 - pj_mlfn_default(phi, E = Math.sin(phi), c = Math.cos(phi), this.en), E = c * lam / (rh * Math.sqrt(1 - this.es * E * E)), c;
	p.x = rh * Math.sin(E);
	p.y = this.am1 - rh * Math.cos(E);
	p.x = this.a * p.x + (this.x0 || 0);
	p.y = this.a * p.y + (this.y0 || 0);
	return p;
}
function e_inv(p) {
	p.x = (p.x - (this.x0 || 0)) / this.a;
	p.y = (p.y - (this.y0 || 0)) / this.a;
	var s, rh = hypot_default(p.x, p.y = this.am1 - p.y), lam, phi = pj_inv_mlfn_default(this.am1 + this.m1 - rh, this.es, this.en);
	if ((s = Math.abs(phi)) < HALF_PI) {
		s = Math.sin(phi);
		lam = rh * Math.atan2(p.x, p.y) * Math.sqrt(1 - this.es * s * s) / Math.cos(phi);
	} else if (Math.abs(s - HALF_PI) <= EPS10) lam = 0;
	else throw new Error();
	p.x = adjust_lon_default(lam + (this.long0 || 0), this.over);
	p.y = adjust_lat_default(phi);
	return p;
}
function s_fwd(p) {
	var lam = adjust_lon_default(p.x - (this.long0 || 0), this.over);
	var phi = p.y;
	var E, rh = this.cphi1 + this.phi1 - phi;
	if (Math.abs(rh) > EPS10) {
		p.x = rh * Math.sin(E = lam * Math.cos(phi) / rh);
		p.y = this.cphi1 - rh * Math.cos(E);
	} else p.x = p.y = 0;
	p.x = this.a * p.x + (this.x0 || 0);
	p.y = this.a * p.y + (this.y0 || 0);
	return p;
}
function s_inv(p) {
	p.x = (p.x - (this.x0 || 0)) / this.a;
	p.y = (p.y - (this.y0 || 0)) / this.a;
	var lam, phi;
	var rh = hypot_default(p.x, p.y = this.cphi1 - p.y);
	phi = this.cphi1 + this.phi1 - rh;
	if (Math.abs(phi) > HALF_PI) throw new Error();
	if (Math.abs(Math.abs(phi) - HALF_PI) <= EPS10) lam = 0;
	else lam = rh * Math.atan2(p.x, p.y) / Math.cos(phi);
	p.x = adjust_lon_default(lam + (this.long0 || 0), this.over);
	p.y = adjust_lat_default(phi);
	return p;
}
var bonne_default = {
	init: init$1,
	names: ["bonne", "Bonne (Werner lat_1=90)"]
};
//#endregion
//#region node_modules/proj4/lib/projections/ob_tran.js
/**
Original projection implementation:
https://github.com/OSGeo/PROJ/blob/46c47e9adf6376ae06afabe5d24a0016a05ced82/src/projections/ob_tran.cpp

Documentation:
https://proj.org/operations/projections/ob_tran.html

References/Formulas:
https://pubs.usgs.gov/pp/1395/report.pdf

Examples:
+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90
+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90 +lon_0=60
+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90 +lon_0=-90
*/
var projectionType = {
	OBLIQUE: {
		forward: forwardOblique,
		inverse: inverseOblique
	},
	TRANSVERSE: {
		forward: forwardTransverse,
		inverse: inverseTransverse
	}
};
/**
* @typedef {Object} LocalThis
* @property {number} lamp
* @property {number} cphip
* @property {number} sphip
* @property {Object} projectionType
* @property {string | undefined} o_proj
* @property {string | undefined} o_lon_p
* @property {string | undefined} o_lat_p
* @property {string | undefined} o_alpha
* @property {string | undefined} o_lon_c
* @property {string | undefined} o_lat_c
* @property {string | undefined} o_lon_1
* @property {string | undefined} o_lat_1
* @property {string | undefined} o_lon_2
* @property {string | undefined} o_lat_2
* @property {number | undefined} oLongP
* @property {number | undefined} oLatP
* @property {number | undefined} oAlpha
* @property {number | undefined} oLongC
* @property {number | undefined} oLatC
* @property {number | undefined} oLong1
* @property {number | undefined} oLat1
* @property {number | undefined} oLong2
* @property {number | undefined} oLat2
* @property {boolean} isIdentity
* @property {import('..').Converter} obliqueProjection
*
*/
/**
*    Parameters can be from the following sets:
*       New pole --> o_lat_p, o_lon_p
*       Rotate about point --> o_alpha, o_lon_c, o_lat_c
*       New equator points --> lon_1, lat_1, lon_2, lat_2
*
*    Per the original source code, the parameter sets are
*    checked in the order of the object below.
*/
var paramSets = {
	ROTATE: {
		o_alpha: "oAlpha",
		o_lon_c: "oLongC",
		o_lat_c: "oLatC"
	},
	NEW_POLE: {
		o_lat_p: "oLatP",
		o_lon_p: "oLongP"
	},
	NEW_EQUATOR: {
		o_lon_1: "oLong1",
		o_lat_1: "oLat1",
		o_lon_2: "oLong2",
		o_lat_2: "oLat2"
	}
};
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function init() {
	this.x0 = this.x0 || 0;
	this.y0 = this.y0 || 0;
	this.long0 = this.long0 || 0;
	this.title = this.title || "General Oblique Transformation";
	this.isIdentity = names$35.includes(this.o_proj);
	/** Verify required parameters exist */
	if (!this.o_proj) throw new Error("Missing parameter: o_proj");
	if (this.o_proj === `ob_tran`) throw new Error("Invalid value for o_proj: " + this.o_proj);
	/** @type {import('../defs.js').ProjectionDefinition} */
	const oProj = Projection(this.projStr.replace("+proj=ob_tran", "").replace("+o_proj=", "+proj=").trim());
	if (!oProj) throw new Error("Invalid parameter: o_proj. Unknown projection " + this.o_proj);
	oProj.long0 = 0;
	this.obliqueProjection = oProj;
	let matchedSet;
	const paramSetsKeys = Object.keys(paramSets);
	/**
	* parse strings, convert to radians, throw on NaN
	* @param {string} name
	* @returns {number | undefined}
	*/
	const parseParam = (name) => {
		if (typeof this[name] === `undefined`) return;
		const val = parseFloat(this[name]) * D2R$1;
		if (isNaN(val)) throw new Error("Invalid value for " + name + ": " + this[name]);
		return val;
	};
	for (let i = 0; i < paramSetsKeys.length; i++) {
		const set = paramSets[paramSetsKeys[i]];
		const params = Object.entries(set);
		if (!params.some(([p]) => typeof this[p] !== "undefined")) continue;
		matchedSet = set;
		for (let ii = 0; ii < params.length; ii++) {
			const [inputParam, param] = params[ii];
			const val = parseParam(inputParam);
			if (typeof val === "undefined") throw new Error("Missing parameter: " + inputParam + ".");
			this[param] = val;
		}
		break;
	}
	if (!matchedSet) throw new Error("No valid parameters provided for ob_tran projection.");
	const { lamp, phip } = createRotation(this, matchedSet);
	this.lamp = lamp;
	if (Math.abs(phip) > 1e-10) {
		this.cphip = Math.cos(phip);
		this.sphip = Math.sin(phip);
		this.projectionType = projectionType.OBLIQUE;
	} else this.projectionType = projectionType.TRANSVERSE;
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function forward(p) {
	return this.projectionType.forward(this, p);
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
function inverse(p) {
	return this.projectionType.inverse(this, p);
}
/**
* @param {import('../defs.js').ProjectionDefinition & LocalThis} params - Initialized projection definition
* @param {Object} how - Transformation method
* @returns {{phip: number, lamp: number}}
*/
function createRotation(params, how) {
	let phip, lamp;
	if (how === paramSets.ROTATE) {
		let lamc = params.oLongC;
		let phic = params.oLatC;
		let alpha = params.oAlpha;
		if (Math.abs(Math.abs(phic) - HALF_PI) <= 1e-10) throw new Error("Invalid value for o_lat_c: " + params.o_lat_c + " should be < 90°");
		lamp = lamc + Math.atan2(-1 * Math.cos(alpha), -1 * Math.sin(alpha) * Math.sin(phic));
		phip = Math.asin(Math.cos(phic) * Math.sin(alpha));
	} else if (how === paramSets.NEW_POLE) {
		lamp = params.oLongP;
		phip = params.oLatP;
	} else {
		let lam1 = params.oLong1;
		let phi1 = params.oLat1;
		let lam2 = params.oLong2;
		let phi2 = params.oLat2;
		let con = Math.abs(phi1);
		if (Math.abs(phi1) > HALF_PI - 1e-10) throw new Error("Invalid value for o_lat_1: " + params.o_lat_1 + " should be < 90°");
		if (Math.abs(phi2) > HALF_PI - 1e-10) throw new Error("Invalid value for o_lat_2: " + params.o_lat_2 + " should be < 90°");
		if (Math.abs(phi1 - phi2) < 1e-10) throw new Error("Invalid value for o_lat_1 and o_lat_2: o_lat_1 should be different from o_lat_2");
		if (con < 1e-10) throw new Error("Invalid value for o_lat_1: o_lat_1 should be different from zero");
		lamp = Math.atan2(Math.cos(phi1) * Math.sin(phi2) * Math.cos(lam1) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam2), Math.sin(phi1) * Math.cos(phi2) * Math.sin(lam2) - Math.cos(phi1) * Math.sin(phi2) * Math.sin(lam1));
		phip = Math.atan(-1 * Math.cos(lamp - lam1) / Math.tan(phi1));
	}
	return {
		lamp,
		phip
	};
}
/**
* Forward (lng, lat) to (x, y) for oblique case
* @param {import('../defs.js').ProjectionDefinition & LocalThis} self
* @param {{x: number, y: number}} lp - lambda, phi
*/
function forwardOblique(self, lp) {
	let { x: lam, y: phi } = lp;
	lam = adjust_lon_default(lam - self.long0, self.over);
	const coslam = Math.cos(lam);
	const sinphi = Math.sin(phi);
	const cosphi = Math.cos(phi);
	lp.x = adjust_lon_default(Math.atan2(cosphi * Math.sin(lam), self.sphip * cosphi * coslam + self.cphip * sinphi) + self.lamp);
	lp.y = Math.asin(self.sphip * sinphi - self.cphip * cosphi * coslam);
	const result = self.obliqueProjection.forward(lp);
	if (self.isIdentity) {
		result.x *= R2D;
		result.y *= R2D;
	}
	return result;
}
/**
* Forward (lng, lat) to (x, y) for transverse case
* @param {import('../defs.js').ProjectionDefinition & LocalThis} self
* @param {{x: number, y: number}} lp - lambda, phi
*/
function forwardTransverse(self, lp) {
	let { x: lam, y: phi } = lp;
	lam = adjust_lon_default(lam - self.long0, self.over);
	const cosphi = Math.cos(phi);
	const coslam = Math.cos(lam);
	lp.x = adjust_lon_default(Math.atan2(cosphi * Math.sin(lam), Math.sin(phi)) + self.lamp);
	lp.y = Math.asin(-1 * cosphi * coslam);
	const result = self.obliqueProjection.forward(lp);
	if (self.isIdentity) {
		result.x *= R2D;
		result.y *= R2D;
	}
	return result;
}
/**
* Inverse (x, y) to (lng, lat) for oblique case
* @param {import('../defs.js').ProjectionDefinition & LocalThis} self
* @param {{x: number, y: number}} lp - lambda, phi
*/
function inverseOblique(self, lp) {
	if (self.isIdentity) {
		lp.x *= D2R$1;
		lp.y *= D2R$1;
	}
	let { x: lam, y: phi } = self.obliqueProjection.inverse(lp);
	if (lam < Number.MAX_VALUE) {
		lam -= self.lamp;
		const coslam = Math.cos(lam);
		const sinphi = Math.sin(phi);
		const cosphi = Math.cos(phi);
		lp.x = Math.atan2(cosphi * Math.sin(lam), self.sphip * cosphi * coslam - self.cphip * sinphi);
		lp.y = Math.asin(self.sphip * sinphi + self.cphip * cosphi * coslam);
	}
	lp.x = adjust_lon_default(lp.x + self.long0);
	return lp;
}
/**
* Inverse (x, y) to (lng, lat) for transverse case
* @param {import('../defs.js').ProjectionDefinition & LocalThis} self
* @param {{x: number, y: number}} lp - lambda, phi
*/
function inverseTransverse(self, lp) {
	if (self.isIdentity) {
		lp.x *= D2R$1;
		lp.y *= D2R$1;
	}
	let { x: lam, y: phi } = self.obliqueProjection.inverse(lp);
	if (lam < Number.MAX_VALUE) {
		const cosphi = Math.cos(phi);
		lam -= self.lamp;
		lp.x = Math.atan2(cosphi * Math.sin(lam), -1 * Math.sin(phi));
		lp.y = Math.asin(cosphi * Math.cos(lam));
	}
	lp.x = adjust_lon_default(lp.x + self.long0);
	return lp;
}
var ob_tran_default = {
	init,
	forward,
	inverse,
	names: [
		"General Oblique Transformation",
		"General_Oblique_Transformation",
		"ob_tran"
	]
};
//#endregion
//#region node_modules/proj4/projs.js
function projs_default(proj4) {
	proj4.Proj.projections.add(tmerc_default);
	proj4.Proj.projections.add(etmerc_default);
	proj4.Proj.projections.add(utm_default);
	proj4.Proj.projections.add(sterea_default);
	proj4.Proj.projections.add(stere_default);
	proj4.Proj.projections.add(somerc_default);
	proj4.Proj.projections.add(omerc_default);
	proj4.Proj.projections.add(lcc_default);
	proj4.Proj.projections.add(krovak_default);
	proj4.Proj.projections.add(cass_default);
	proj4.Proj.projections.add(laea_default);
	proj4.Proj.projections.add(aea_default);
	proj4.Proj.projections.add(gnom_default);
	proj4.Proj.projections.add(cea_default);
	proj4.Proj.projections.add(eqc_default);
	proj4.Proj.projections.add(poly_default);
	proj4.Proj.projections.add(nzmg_default);
	proj4.Proj.projections.add(mill_default);
	proj4.Proj.projections.add(sinu_default);
	proj4.Proj.projections.add(eck6_default);
	proj4.Proj.projections.add(moll_default);
	proj4.Proj.projections.add(eqdc_default);
	proj4.Proj.projections.add(vandg_default);
	proj4.Proj.projections.add(aeqd_default);
	proj4.Proj.projections.add(ortho_default);
	proj4.Proj.projections.add(qsc_default);
	proj4.Proj.projections.add(robin_default);
	proj4.Proj.projections.add(geocent_default);
	proj4.Proj.projections.add(tpers_default);
	proj4.Proj.projections.add(geos_default);
	proj4.Proj.projections.add(eqearth_default);
	proj4.Proj.projections.add(bonne_default);
	proj4.Proj.projections.add(ob_tran_default);
}
//#endregion
//#region node_modules/proj4/lib/index.js
/**
* @typedef {Object} Mgrs
* @property {(lonlat: [number, number]) => string} forward
* @property {(mgrsString: string) => [number, number, number, number]} inverse
* @property {(mgrsString: string) => [number, number]} toPoint
*/
/**
* @typedef {import('./defs').ProjectionDefinition} ProjectionDefinition
* @typedef {import('./core').TemplateCoordinates} TemplateCoordinates
* @typedef {import('./core').InterfaceCoordinates} InterfaceCoordinates
* @typedef {import('./core').Converter} Converter
* @typedef {import('./Proj').DatumDefinition} DatumDefinition
*/
/**
* @template {import('./core').TemplateCoordinates} T
* @type {core<T> & {defaultDatum: string, Proj: typeof Proj, WGS84: Proj, Point: typeof Point, toPoint: typeof common, defs: typeof defs, nadgrid: typeof nadgrid, transform: typeof transform, mgrs: Mgrs, version: string}}
*/
var proj4 = Object.assign(proj4$1, {
	defaultDatum: "WGS84",
	Proj: Projection,
	WGS84: new Projection("WGS84"),
	Point,
	toPoint: toPoint_default,
	defs,
	nadgrid,
	transform,
	mgrs: mgrs_default,
	version: "__VERSION__"
});
projs_default(proj4);
//#endregion
//#region src/rndt/crs.ts
/**
* GeoJSON is WGS84 longitude/latitude (RFC 7946), but Italian publishers
* still serve files with the old `crs` member and projected coordinates
* (datigis.comune.fi.it: EPSG:3003, positions like 1684025, 4847704,
* 2026-10-02). GeoLibre reads them as degrees and draws nothing, so the
* plugin converts them first. Definitions from epsg.io, for the systems
* Italian data come in.
*/
var DEFINITIONS = {
	3003: "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs",
	3004: "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs",
	4265: "+proj=longlat +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +no_defs",
	4230: "+proj=longlat +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +no_defs",
	23032: "+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs",
	23033: "+proj=utm +zone=33 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs",
	25832: "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	25833: "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3044: "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	3045: "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	6707: "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	6708: "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	7791: "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	7792: "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
	32632: "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs",
	32633: "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs",
	3857: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs",
	900913: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs"
};
/** Geographic systems that GeoLibre can take as they are (ETRS89 and WGS84 agree to the metre). */
var AS_IS = new Set([
	4326,
	4258,
	6706,
	4979,
	4937
]);
/** The EPSG code the file declares in its `crs` member, 0 for CRS84, null when it declares none. */
function declaredEpsg(fc) {
	const crs = fc.crs;
	const name = crs?.properties?.name;
	if (typeof name !== "string") return typeof crs?.properties?.code === "number" ? crs.properties.code : null;
	if (/CRS84$/i.test(name)) return 0;
	const m = /EPSG:(?::\d+(?:\.\d+)?:)?:?(\d+)$/i.exec(name) ?? /\bEPSG::?(\d+)\b/i.exec(name);
	return m ? Number(m[1]) : null;
}
/**
* The collection in WGS84, with the code it was converted from (null when it
* already was longitude/latitude). Throws, with the reason, for a system the
* plugin has no definition of and for projected coordinates with no `crs`.
*/
function toWgs84(fc) {
	const code = declaredEpsg(fc);
	if (code === 0 || code !== null && AS_IS.has(code)) return {
		fc: stripCrs(fc),
		from: null
	};
	if (code === null) {
		const first = fc.features.map((f) => firstPosition$1(f.geometry)).find(Boolean);
		if (first && (Math.abs(first[0]) > 180 || Math.abs(first[1]) > 90)) throw new Error(`the coordinates are not longitude/latitude (first position ${first[0]}, ${first[1]}) and the file declares no system`);
		return {
			fc,
			from: null
		};
	}
	const definition = DEFINITIONS[code];
	if (!definition) throw new Error(`the coordinates are in EPSG:${code}, a system the plugin cannot convert`);
	const convert = proj4(definition, "WGS84").forward;
	return {
		fc: {
			...stripCrs(fc),
			features: fc.features.map((f) => ({
				...f,
				geometry: mapGeometry(f.geometry, convert)
			}))
		},
		from: code
	};
}
function stripCrs(fc) {
	const copy = { ...fc };
	delete copy.crs;
	return copy;
}
function mapGeometry(geometry, convert) {
	if (!geometry) return geometry;
	if (geometry.type === "GeometryCollection") return {
		...geometry,
		geometries: geometry.geometries.map((g) => mapGeometry(g, convert))
	};
	return {
		...geometry,
		coordinates: mapPositions(geometry.coordinates, convert)
	};
}
function mapPositions(coords, convert) {
	if (Array.isArray(coords) && typeof coords[0] === "number") {
		const [x, y, ...rest] = coords;
		const [lon, lat] = convert([x, y]);
		return [
			lon,
			lat,
			...rest
		];
	}
	return Array.isArray(coords) ? coords.map((c) => mapPositions(c, convert)) : coords;
}
function firstPosition$1(geometry) {
	if (!geometry) return null;
	if (geometry.type === "GeometryCollection") {
		for (const g of geometry.geometries) {
			const p = firstPosition$1(g);
			if (p) return p;
		}
		return null;
	}
	let coords = geometry.coordinates;
	while (Array.isArray(coords) && Array.isArray(coords[0])) coords = coords[0];
	return Array.isArray(coords) && typeof coords[0] === "number" ? coords : null;
}
//#endregion
//#region src/rndt/footprints-layer.ts
var SOURCE_ID = `${PLUGIN_ID}-footprints`;
var FILL_ID = `${SOURCE_ID}-fill`;
var LINE_ID = `${SOURCE_ID}-line`;
var HOVER_ID = `${SOURCE_ID}-hover`;
var SELECTED_ID = `${SOURCE_ID}-selected`;
var COLOR = "#d9480f";
var HOVER_COLOR = "#1971c2";
var LAYER_IDS = [
	FILL_ID,
	LINE_ID,
	HOVER_ID,
	SELECTED_ID
];
var EMPTY = {
	type: "FeatureCollection",
	features: []
};
/**
* Search-result footprints drawn straight on the MapLibre map. They are a
* temporary aid, replaced on every search, so they are not added to the
* project's layer store (the plugin API has no call to remove a store layer).
* A basemap change rebuilds the style and drops them: `styledata` re-adds them.
*/
var FootprintsLayer = class {
	map;
	onSelect;
	onHover;
	data = EMPTY;
	selectedId = null;
	hoverId = null;
	/** Chooser shown when a click hits several footprints. */
	menu = null;
	tooltip = null;
	visible = true;
	/** Records whose footprint is hidden one by one; reset by `setData`. */
	hiddenIds = /* @__PURE__ */ new Set();
	lastMove = 0;
	onStyleData = () => this.ensure();
	onClick = (event) => {
		const hits = this.hitsAt(event.features);
		if (hits.length === 1) this.onSelect(hits[0].id);
		else if (hits.length > 1) this.openMenu(hits, event.point);
	};
	onMove = (event) => {
		this.map.getCanvas().style.cursor = "pointer";
		if (this.menu) return;
		const hits = this.hitsAt(event.features);
		this.setHover(hits[0]?.id ?? null);
		this.showTooltip(hits, event.point);
	};
	onLeave = () => {
		this.map.getCanvas().style.cursor = "";
		if (this.menu) return;
		this.setHover(null);
		this.hideTooltip();
	};
	closeMenu = () => {
		if (!this.menu) return;
		this.menu.remove();
		this.menu = null;
		this.setHover(null);
		this.map.off("movestart", this.closeMenu);
		document.removeEventListener("keydown", this.onKey);
		document.removeEventListener("pointerdown", this.onOutside, true);
	};
	onKey = (event) => {
		if (event.key === "Escape") this.closeMenu();
	};
	onOutside = (event) => {
		if (this.menu && !this.menu.contains(event.target)) this.closeMenu();
	};
	constructor(map, onSelect, onHover = () => void 0) {
		this.map = map;
		this.onSelect = onSelect;
		this.onHover = onHover;
		map.on("styledata", this.onStyleData);
		map.on("click", FILL_ID, this.onClick);
		map.on("mousemove", FILL_ID, this.onMove);
		map.on("mouseleave", FILL_ID, this.onLeave);
	}
	/**
	* The footprints under the cursor, once each, smallest first: a click inside
	* a small extent means that record, not the regional or national extents
	* around it, which win by drawing order alone.
	*/
	hitsAt(features) {
		const hits = /* @__PURE__ */ new Map();
		for (const feature of features ?? []) {
			const id = feature.properties?.id;
			if (typeof id !== "string" || hits.has(id) || this.hiddenIds.has(id)) continue;
			const title = String(feature.properties?.title ?? id);
			hits.set(id, {
				id,
				title,
				area: this.areaOf(id)
			});
		}
		return [...hits.values()].sort((a, b) => a.area - b.area);
	}
	/** Extent area in square degrees, from the source data (tiles clip the rendered geometry). */
	areaOf(recordId) {
		const feature = this.data.features.find((f) => f.properties?.id === recordId);
		if (feature?.geometry.type !== "Polygon") return Infinity;
		const [[w, s], , [e, n]] = feature.geometry.coordinates[0];
		return Math.abs((e - w) * (n - s));
	}
	openMenu(hits, point) {
		this.closeMenu();
		this.hideTooltip();
		const menu = document.createElement("div");
		menu.className = "ordt-footprint-menu";
		menu.setAttribute("role", "menu");
		const head = document.createElement("div");
		head.className = "ordt-footprint-menu-head";
		head.textContent = `${hits.length} footprints here, smallest first`;
		menu.append(head);
		for (const hit of hits) {
			const item = document.createElement("button");
			item.type = "button";
			item.className = "ordt-footprint-menu-item";
			item.setAttribute("role", "menuitem");
			item.textContent = hit.title;
			item.title = hit.title;
			item.addEventListener("mouseenter", () => this.setHover(hit.id));
			item.addEventListener("focus", () => this.setHover(hit.id));
			item.addEventListener("click", () => {
				this.closeMenu();
				this.onSelect(hit.id);
			});
			menu.append(item);
		}
		const container = this.map.getContainer();
		container.append(menu);
		const x = Math.min(point.x, container.clientWidth - menu.offsetWidth - 4);
		const y = Math.min(point.y, container.clientHeight - menu.offsetHeight - 4);
		menu.style.left = `${Math.max(4, x)}px`;
		menu.style.top = `${Math.max(4, y)}px`;
		this.menu = menu;
		this.setHover(hits[0].id);
		this.map.on("movestart", this.closeMenu);
		document.addEventListener("keydown", this.onKey);
		document.addEventListener("pointerdown", this.onOutside, true);
	}
	showTooltip(hits, point) {
		if (!hits.length) return this.hideTooltip();
		if (!this.tooltip) {
			this.tooltip = document.createElement("div");
			this.tooltip.className = "ordt-footprint-tooltip";
			this.map.getContainer().append(this.tooltip);
		}
		const more = hits.length > 1 ? ` (+${hits.length - 1}, click to choose)` : "";
		this.tooltip.textContent = `${hits[0].title}${more}`;
		const container = this.map.getContainer();
		const { offsetWidth: w, offsetHeight: h } = this.tooltip;
		const x = point.x + 12 + w > container.clientWidth ? point.x - 12 - w : point.x + 12;
		const y = point.y + 12 + h > container.clientHeight ? point.y - 12 - h : point.y + 12;
		this.tooltip.style.left = `${Math.max(4, x)}px`;
		this.tooltip.style.top = `${Math.max(4, y)}px`;
	}
	hideTooltip() {
		this.tooltip?.remove();
		this.tooltip = null;
	}
	ensure() {
		try {
			this.addToMap();
		} catch {}
	}
	addToMap() {
		const map = this.map;
		if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, {
			type: "geojson",
			data: this.data
		});
		if (!map.getLayer(FILL_ID)) map.addLayer({
			id: FILL_ID,
			type: "fill",
			source: SOURCE_ID,
			layout: { visibility: this.visibility() },
			filter: this.shownFilter(),
			paint: {
				"fill-color": COLOR,
				"fill-opacity": [
					"interpolate",
					["linear"],
					["zoom"],
					4,
					.05,
					8,
					.02,
					10,
					0
				]
			}
		});
		if (!map.getLayer(LINE_ID)) map.addLayer({
			id: LINE_ID,
			type: "line",
			source: SOURCE_ID,
			layout: { visibility: this.visibility() },
			filter: this.shownFilter(),
			paint: {
				"line-color": COLOR,
				"line-width": 1.2,
				"line-opacity": .8
			}
		});
		if (!map.getLayer(HOVER_ID)) map.addLayer({
			id: HOVER_ID,
			type: "line",
			source: SOURCE_ID,
			layout: { visibility: this.visibility() },
			paint: {
				"line-color": HOVER_COLOR,
				"line-width": 3
			},
			filter: this.hoverFilter()
		});
		if (!map.getLayer(SELECTED_ID)) map.addLayer({
			id: SELECTED_ID,
			type: "line",
			source: SOURCE_ID,
			layout: { visibility: this.visibility() },
			paint: {
				"line-color": COLOR,
				"line-width": 3.5
			},
			filter: this.selectedFilter()
		});
		this.keepVisibility();
		this.keepOnTop();
	}
	/**
	* The host can turn the layers back on: GeoLibre does when a layer of the
	* project is hidden and shown again, and footprints hidden with "Hide
	* footprints" came back with the link still reading "Show footprints"
	* (2026-10-03). The check runs on every `styledata` and sets only what differs.
	*/
	keepVisibility() {
		const wanted = this.visibility();
		for (const id of LAYER_IDS) if (this.map.getLayer(id) && (this.map.getLayoutProperty(id, "visibility") ?? "visible") !== wanted) this.map.setLayoutProperty(id, "visibility", wanted);
	}
	/**
	* Layers added after the footprints (a new basemap is added as a layer on
	* top, as are WMS layers) would hide them: move them back to the top. The
	* check runs on every `styledata`, so it only moves when needed.
	*/
	keepOnTop() {
		const map = this.map;
		const order = map.getLayersOrder();
		const ours = LAYER_IDS;
		if (order.slice(-ours.length).join() === ours.join()) return;
		const now = Date.now();
		if (now - this.lastMove < 1e3) return;
		this.lastMove = now;
		for (const id of ours) map.moveLayer(id);
	}
	setData(data) {
		this.closeMenu();
		this.hideTooltip();
		this.data = data;
		this.selectedId = null;
		this.hoverId = null;
		this.hiddenIds.clear();
		this.ensure();
		this.map.getSource(SOURCE_ID)?.setData(data);
		this.applyFilters();
	}
	/** Show or hide all footprints. Showing also brings back those hidden one by one. */
	setVisible(visible) {
		this.visible = visible;
		if (!visible) {
			this.closeMenu();
			this.hideTooltip();
		}
		if (visible && this.hiddenIds.size) {
			this.hiddenIds.clear();
			this.applyFilters();
		}
		for (const id of LAYER_IDS) if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", this.visibility());
	}
	isVisible() {
		return this.visible;
	}
	/** Show or hide one record's footprint. */
	setHidden(recordId, hidden) {
		if (hidden) this.hiddenIds.add(recordId);
		else this.hiddenIds.delete(recordId);
		this.applyFilters();
	}
	isHidden(recordId) {
		return this.hiddenIds.has(recordId);
	}
	visibility() {
		return this.visible ? "visible" : "none";
	}
	/** Features not hidden one by one. */
	shownFilter() {
		return ["!", [
			"in",
			["get", "id"],
			["literal", [...this.hiddenIds]]
		]];
	}
	selectedFilter() {
		return [
			"all",
			[
				"==",
				["get", "id"],
				this.selectedId ?? ""
			],
			this.shownFilter()
		];
	}
	hoverFilter() {
		return [
			"all",
			[
				"==",
				["get", "id"],
				this.hoverId ?? ""
			],
			this.shownFilter()
		];
	}
	/** Highlight one footprint (a result hovered in the list), or none. */
	highlight(recordId) {
		if (this.hoverId === recordId) return;
		this.hoverId = recordId;
		if (this.map.getLayer(HOVER_ID)) this.map.setFilter(HOVER_ID, this.hoverFilter());
	}
	/** Map-side hover: highlight and tell the panel. */
	setHover(recordId) {
		if (this.hoverId === recordId) return;
		this.highlight(recordId);
		this.onHover(recordId);
	}
	select(recordId) {
		this.selectedId = recordId;
		this.applyFilters();
	}
	applyFilters() {
		const map = this.map;
		if (map.getLayer(FILL_ID)) map.setFilter(FILL_ID, this.shownFilter());
		if (map.getLayer(LINE_ID)) map.setFilter(LINE_ID, this.shownFilter());
		if (map.getLayer(HOVER_ID)) map.setFilter(HOVER_ID, this.hoverFilter());
		if (map.getLayer(SELECTED_ID)) map.setFilter(SELECTED_ID, this.selectedFilter());
	}
	clear() {
		this.setData(EMPTY);
	}
	remove() {
		const map = this.map;
		this.closeMenu();
		this.hideTooltip();
		map.off("styledata", this.onStyleData);
		map.off("click", FILL_ID, this.onClick);
		map.off("mousemove", FILL_ID, this.onMove);
		map.off("mouseleave", FILL_ID, this.onLeave);
		for (const id of [
			SELECTED_ID,
			HOVER_ID,
			LINE_ID,
			FILL_ID
		]) if (map.getLayer(id)) map.removeLayer(id);
		if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
	}
};
//#endregion
//#region src/rndt/arcgis.ts
/**
* ArcGIS REST services (MapServer, ImageServer, FeatureServer). GeoLibre adds
* them from its own Add Data dialog with a function plugins do not get; a
* plugin gets the same result with a tile layer on the service's `export`
* request and, for features, a GeoJSON layer from its `query` request.
*/
/** Kind of the ArcGIS REST links, as shown on the badges. */
var ARCGIS_KIND = "ArcGIS REST";
var SERVICE_TYPES = [
	"MapServer",
	"ImageServer",
	"FeatureServer"
];
/**
* The parts of a link to an ArcGIS REST service or to one of its layers, null
* for any other URL: `…/MapServer/WMSServer` and `…/MapServer/WMTS` are OGC
* services, `…/services/…/MapServer` without `rest` is the SOAP endpoint.
*/
function parseArcgisUrl(url) {
	const match = /^(https?:\/\/[^?#]+?\/rest\/services\/[^?#]+?)\/(MapServer|ImageServer|FeatureServer)(?:\/(\d+))?\/?(?:[?#].*)?$/i.exec(url.trim());
	if (!match) return null;
	const type = SERVICE_TYPES.find((t) => t.toLowerCase() === match[2].toLowerCase());
	return {
		serviceUrl: `${match[1]}/${type}`,
		type,
		layerId: match[3] ?? null
	};
}
/** The ArcGIS REST service a WMTS link belongs to (`…/MapServer/WMTS…`), or null. */
function arcgisRestFromWmts(url) {
	const match = /^(https?:\/\/[^?#]+?\/rest\/services\/[^?#]+?\/(?:MapServer|ImageServer))\/WMTS(?:[/?#]|$)/i.exec(url);
	return match ? match[1] : null;
}
var asObject$1 = (value) => value && typeof value === "object" ? value : {};
/**
* ArcGIS answers its errors with HTTP 200 and `{"error": {"code", "message"}}`:
* 499 is a service that needs a login, 404 and 500 one that is gone.
*/
function throwArcgisError(json) {
	const error = asObject$1(json).error;
	if (!error) return;
	const { code, message } = asObject$1(error);
	const text = typeof message === "string" && message.trim() ? message.trim() : "no message";
	throw new Error(`the server answers ${typeof code === "number" ? `${code}, ` : ""}"${text}"${code === 499 ? " (the service needs a login)" : ""}`);
}
var listed = (value) => typeof value === "string" ? value.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean) : [];
/** What a service offers, from its `?f=json` description. */
function parseArcgisService(json, type) {
	throwArcgisError(json);
	const info = asObject$1(json);
	const capabilities = listed(info.capabilities);
	const layers = (Array.isArray(info.layers) ? info.layers : []).map(asObject$1).filter((l) => typeof l.id === "number" && !(Array.isArray(l.subLayerIds) && l.subLayerIds.length) && l.type !== "Group Layer").map((l) => ({
		name: String(l.id),
		title: typeof l.name === "string" ? l.name : "",
		minScale: typeof l.minScale === "number" ? l.minScale : 0,
		maxScale: typeof l.maxScale === "number" ? l.maxScale : 0,
		hasFeatures: typeof l.type !== "string" || l.type === "Feature Layer"
	}));
	const hasQuery = type !== "ImageServer" && capabilities.includes("query");
	return {
		layers,
		drawsImage: type !== "FeatureServer" && (!capabilities.length || capabilities.includes(type === "MapServer" ? "map" : "image")),
		hasQuery,
		hasGeoJson: hasQuery && listed(info.supportedQueryFormats).includes("geojson"),
		copyright: typeof info.copyrightText === "string" ? info.copyrightText.trim() : ""
	};
}
/**
* The image request of a service: `export` (MapServer) or `exportImage`
* (ImageServer) in EPSG:3857, as GeoLibre's own ArcGIS layers ask it. `bbox`
* is MapLibre's `{bbox-epsg-3857}` placeholder for a tile layer, or four
* numbers for a single request.
*/
function arcgisExportUrl(service, layerId, bbox, size) {
	const image = service.type === "ImageServer";
	const params = [
		`bbox=${bbox}`,
		"bboxSR=3857",
		"imageSR=3857",
		`size=${size}%2C${size}`,
		"format=png32",
		"transparent=true",
		...image ? [] : ["dpi=96"],
		...!image && layerId !== null ? [`layers=show%3A${layerId}`] : [],
		"f=image"
	];
	return `${service.serviceUrl}/${image ? "exportImage" : "export"}?${params.join("&")}`;
}
/** What a layer's `query` can do, from its `?f=json` description. */
function parseArcgisLayer(json) {
	throwArcgisError(json);
	const info = asObject$1(json);
	const max = info.maxRecordCount;
	return {
		pageSize: typeof max === "number" && max > 0 ? max : 1e3,
		paginates: asObject$1(info.advancedQueryCapabilities).supportsPagination === true,
		geoJson: listed(info.supportedQueryFormats).includes("geojson")
	};
}
/**
* A `query` on a layer for all its features, or those touching `bbox`
* (WGS84): their count, or the features in GeoJSON (WGS84), one page when
* `offset` is given.
*/
function arcgisQueryUrl(layerUrl, options) {
	const params = new URLSearchParams({ where: "1=1" });
	if (options.bbox) {
		params.set("geometry", options.bbox.join(","));
		params.set("geometryType", "esriGeometryEnvelope");
		params.set("inSR", "4326");
		params.set("spatialRel", "esriSpatialRelIntersects");
	}
	if (options.count) {
		params.set("returnCountOnly", "true");
		params.set("f", "json");
	} else {
		params.set("outFields", "*");
		params.set("outSR", "4326");
		if (options.offset !== void 0) params.set("resultOffset", String(options.offset));
		if (options.limit !== void 0) params.set("resultRecordCount", String(options.limit));
		params.set("f", "geojson");
	}
	return `${layerUrl}/query?${params.toString()}`;
}
/** The count of a `returnCountOnly` answer, null when it holds none. */
function parseArcgisCount(json) {
	throwArcgisError(json);
	const count = asObject$1(json).count;
	return typeof count === "number" ? count : null;
}
/**
* When a layer is drawn only at some scales, say which: a layer limited to
* 1:50,000 and closer shows nothing at regional zoom, and looks broken.
*/
function scaleNote(layer) {
	const scale = (n) => `1:${Math.round(n).toLocaleString("en")}`;
	if (layer.minScale > 0 && layer.maxScale > 0) return `Drawn only between ${scale(layer.minScale)} and ${scale(layer.maxScale)}.`;
	if (layer.minScale > 0) return `Drawn only at ${scale(layer.minScale)} and closer: zoom in to see it.`;
	if (layer.maxScale > 0) return `Drawn only up to ${scale(layer.maxScale)}.`;
	return null;
}
/** Give up on a request after this long: some public servers never answer. */
var REQUEST_TIMEOUT_MS = 25e3;
/**
* Budget for data downloads (WFS features, GeoJSON files): a whole-region WFS
* layer can take 15 s and 20 MB (FVG `RIFIUTI:TDLD8`, 2026-09-27), well past
* the native client's 8 s default behind `fetchArrayBuffer`.
*/
var DOWNLOAD_TIMEOUT_MS = 18e4;
function withTimeout(promise, ms) {
	let timer;
	const timeout = new Promise((_, reject) => {
		timer = setTimeout(() => reject(/* @__PURE__ */ new Error(`no answer after ${Math.round(ms / 1e3)} s`)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
async function fetchOnce(host, url, options) {
	const budget = options.download ? DOWNLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
	if (options.download && host.fetchVectorUrl) {
		const file = await withTimeout(host.fetchVectorUrl(url), budget);
		if (file) return file.text();
	}
	if (host.fetchArrayBuffer) {
		const buffer = await withTimeout(host.fetchArrayBuffer(url), budget);
		return new TextDecoder().decode(buffer);
	}
	const response = await fetch(url, { signal: AbortSignal.timeout(budget) });
	if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
	return response.text();
}
/**
* Fetch a URL as text and report the URL that answered. In GeoLibre Desktop
* `fetchArrayBuffer` goes through the native HTTP client, so third-party
* services need no CORS headers; elsewhere it falls back to `fetch`.
*
* Many RNDT records still declare `http://` links for servers that now answer
* only on HTTPS (e.g. rsdi.regione.basilicata.it times out on port 80), so an
* `http://` URL is tried as `https://` first, then as given.
*/
async function fetchTextFrom(host, url, options = {}) {
	const candidates = /^http:\/\//i.test(url) ? [url.replace(/^http:/i, "https:"), url] : [url];
	let lastError = null;
	for (const candidate of candidates) try {
		return {
			text: await fetchOnce(host, candidate, options),
			url: candidate
		};
	} catch (error) {
		lastError = error;
	}
	const hostname = new URL(url).hostname;
	if (await nameIsMissing(host, hostname)) throw new Error(`server ${hostname} does not exist: its name is not in the DNS`);
	if (!isDesktop() && lastError instanceof Error && lastError.name === "TypeError" && await answersOpaque(candidates[0])) throw new Error(`${hostname} answers, ${BROWSER_BLOCK_NOTE}`);
	const reason = lastError instanceof Error ? lastError.message : String(lastError);
	const tried = candidates.length > 1 ? " (tried HTTPS and HTTP)" : "";
	throw new Error(`cannot reach ${new URL(url).host}${tried}: ${reason}`);
}
/** GeoLibre Desktop (Tauri), whose native client reads services without CORS. */
function isDesktop() {
	return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
/** End of the error for a service the web version cannot read; no error report is offered for it. */
var BROWSER_BLOCK_NOTE = "but a web page cannot read it: the server sends no CORS headers. The service works in GeoLibre Desktop";
/** True when the browser gets an answer it may not read (a request without CORS). */
async function answersOpaque(url) {
	try {
		await fetch(url, {
			mode: "no-cors",
			signal: AbortSignal.timeout(BROWSER_PROBE_TIMEOUT_MS)
		});
		return true;
	} catch {
		return false;
	}
}
/**
* The address to send requests to: the one the capabilities declare, unless
* it is on a host no one outside can reach (tms.comune.fi.it declares its
* GetMap at sr-vm490-sitgfn.comune.intranet:8084, 2026-10-02: a GeoServer
* without a proxy base URL). Then the capabilities' own address, which did
* answer. `note` says so, for the panel.
*/
async function reachableEndpoint(host, declared, capabilitiesUrl, serviceBase) {
	const name = new URL(declared).hostname;
	const own = new URL(capabilitiesUrl).hostname;
	if (name === own || !(isPrivateName(name) || await nameIsMissing(host, name))) return {
		url: declared,
		note: null
	};
	return {
		url: serviceBase(capabilitiesUrl),
		note: `Requests go to ${own}: the capabilities declare ${name}, a name only the publisher's network knows.`
	};
}
/** A host name of a private network: no dot, a private suffix, or a private IPv4 range. */
function isPrivateName(name) {
	if (/^(localhost|[^.]+|.*\.(local|localdomain|intranet|internal|lan|corp|home))$/i.test(name)) return true;
	const m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(name);
	if (!m) return false;
	const [a, b] = [Number(m[1]), Number(m[2])];
	return a === 10 || a === 127 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31;
}
/** Public DNS-over-HTTPS resolver, answers in JSON ("Status": 3 is NXDOMAIN). */
var DNS_RESOLVER = "https://dns.google/resolve";
/**
* True only when a public DNS says the name does not exist. Any other outcome
* (the resolver unreachable, a name with no A record) counts as "exists", so
* the plugin never calls a server gone by mistake. IP addresses are skipped.
*/
async function nameIsMissing(host, hostname) {
	if (/^[\d.]+$|:/.test(hostname)) return false;
	try {
		const text = await withTimeout(fetchOnce(host, `${DNS_RESOLVER}?name=${encodeURIComponent(hostname)}&type=A`, {}), 5e3);
		return JSON.parse(text).Status === 3;
	} catch {
		return false;
	}
}
/** Budget of each browser reachability probe. */
var BROWSER_PROBE_TIMEOUT_MS = 5e3;
/**
* True when the browser cannot reach `httpsUrl` but reaches its http:// twin.
* GeoLibre draws WMS tiles through its native client (redirects followed, no
* CORS), but its feature identify (GetFeatureInfo) uses the browser's fetch.
* A server that answers https with a 301 to http and no CORS header
* (wms.pcn.minambiente.it, 2026-09-27) then shows its tiles while identify
* fails with "Failed to fetch". A manual-redirect fetch cannot tell this
* apart (it fails the CORS check too), so both schemes are simply tried.
*/
async function browserNeedsHttp(httpsUrl) {
	const reaches = async (url) => {
		try {
			await fetch(url, { signal: AbortSignal.timeout(BROWSER_PROBE_TIMEOUT_MS) });
			return true;
		} catch {
			return false;
		}
	};
	if (await reaches(httpsUrl)) return false;
	return reaches(httpsUrl.replace(/^https:/i, "http:"));
}
/** Time allowed to the one-tile test of a WMS in EPSG:3857. */
var IMAGE_PROBE_TIMEOUT_MS = 8e3;
async function probeBytes(host, url) {
	if (host.fetchArrayBuffer) return withTimeout(host.fetchArrayBuffer(url), IMAGE_PROBE_TIMEOUT_MS);
	const response = await fetch(url, { signal: AbortSignal.timeout(IMAGE_PROBE_TIMEOUT_MS) });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return response.arrayBuffer();
}
/**
* True when the URL answers with an image (PNG, JPEG, GIF or WebP by their
* first bytes), false on an error document, an HTTP error or no answer.
*/
async function answersWithImage(host, url) {
	try {
		return isImage(await probeBytes(host, url));
	} catch {
		return false;
	}
}
/**
* Asks one test tile of `size` pixels. A server may answer any request with
* the same picture (the 500×500 map of Italy of the cadastral WMS group layer
* `Cartografia_Catastale`, 2026-10-02): a PNG of another size is not a tile.
*/
async function testTile(host, url, size) {
	try {
		const buffer = await probeBytes(host, url);
		if (!isImage(buffer)) return "none";
		if (new Uint8Array(buffer)[0] !== 137 || buffer.byteLength < 24) return "tile";
		const view = new DataView(buffer);
		return view.getUint32(16) === size && view.getUint32(20) === size ? "tile" : "other-size";
	} catch {
		return "none";
	}
}
/** PNG, JPEG, GIF or WebP, by their first bytes. */
function isImage(buffer) {
	const b = new Uint8Array(buffer.slice(0, 12));
	const png = b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71;
	const jpeg = b[0] === 255 && b[1] === 216;
	const gif = b[0] === 71 && b[1] === 73 && b[2] === 70;
	const webp = b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80;
	return png || jpeg || gif || webp;
}
/**
* True when the browser itself gets an image from the URL. Tiles of a plugin
* tile layer are fetched by the webview, unlike WMS tiles, so a server
* without CORS headers draws nothing although it answers.
*/
async function browserGetsImage(url) {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(IMAGE_PROBE_TIMEOUT_MS) });
		return response.ok && isImage(await response.arrayBuffer());
	} catch {
		return false;
	}
}
async function fetchText(host, url, options = {}) {
	return (await fetchTextFrom(host, url, options)).text;
}
async function fetchJson(host, url, options = {}) {
	const body = await fetchText(host, url, options);
	try {
		return JSON.parse(body);
	} catch {
		throw new Error(`The response from ${new URL(url).host} is not JSON.`);
	}
}
/** Bounding box of drawn shapes, or null when nothing is drawn. */
function drawnBbox(host) {
	const features = host.getDrawnFeatures?.() ?? [];
	let box = null;
	const visit = (coords) => {
		if (Array.isArray(coords) && typeof coords[0] === "number") {
			const [x, y] = coords;
			box = box ? [
				Math.min(box[0], x),
				Math.min(box[1], y),
				Math.max(box[2], x),
				Math.max(box[3], y)
			] : [
				x,
				y,
				x,
				y
			];
		} else if (Array.isArray(coords)) coords.forEach(visit);
	};
	for (const feature of features) {
		const g = feature.geometry;
		if (!g) continue;
		if (g.type === "GeometryCollection") g.geometries.forEach((x) => "coordinates" in x && visit(x.coordinates));
		else visit(g.coordinates);
	}
	if (!box) return null;
	const [w, s, e, n] = box;
	const pad = .001;
	return [
		w === e ? w - pad : w,
		s === n ? s - pad : s,
		w === e ? e + pad : e,
		s === n ? n + pad : n
	];
}
//#endregion
//#region src/rndt/query.ts
function emptyForm() {
	return {
		kind: "all",
		serviceTypes: [],
		availableAs: [],
		text: "",
		textMode: "all",
		field: "",
		keywords: "",
		organisation: "",
		invertOrganisation: false,
		inspireThemes: [],
		openDataOnly: false,
		dateField: "apiso_RevisionDate_dt",
		dateFrom: "",
		dateTo: "",
		bbox: null,
		spatialRel: "Intersects",
		sort: ""
	};
}
var LUCENE_SPECIAL = /[+\-&|!(){}[\]^"~:\\/]/g;
var DATE_RE$1 = /^\d{4}-\d{2}-\d{2}$/;
/** Escape Lucene syntax in a single word, keeping `*` and `?` wildcards. */
function escapeTerm(word) {
	return word.replace(LUCENE_SPECIAL, (c) => `\\${c}`);
}
/** Escape a value placed inside a double-quoted Lucene phrase. */
function escapePhrase(value) {
	return value.replace(/["\\]/g, (c) => `\\${c}`);
}
var REGEX_SPECIAL = /[.?+*|{}[\]()"\\#@&<>~/]/;
/**
* Lucene regular expression matching `value` anywhere in a keyword field,
* ignoring case: each letter becomes a `[xX]` class, specials are escaped.
*/
function containsIgnoreCase(value) {
	return `/.*${Array.from(value.trim()).map((c) => {
		const lower = c.toLowerCase();
		const upper = c.toUpperCase();
		if (lower !== upper) return `[${lower}${upper}]`;
		return REGEX_SPECIAL.test(c) ? `\\${c}` : c;
	}).join("")}.*/`;
}
/** The non-empty, trimmed items of a comma-separated list. */
function splitList(value) {
	return value.split(",").map((item) => item.trim()).filter(Boolean);
}
function quotedOr(values) {
	return values.map((v) => `"${escapePhrase(v)}"`).join(" OR ");
}
/** Error message for an invalid box, or null when it is usable. */
function bboxError(bbox) {
	if (bbox.length !== 4 || !bbox.every((v) => Number.isFinite(v))) return "The box needs four numbers: west, south, east, north.";
	const [w, s, e, n] = bbox;
	if (w < -180 || e > 180 || s < -90 || n > 90) return "Longitudes must be within -180..180 and latitudes within -90..90.";
	if (w >= e || s >= n) return "West must be less than east and south less than north.";
	return null;
}
/** Clamp a map view box to valid WGS84 ranges (a zoomed-out view can exceed them). */
function clampBbox(bbox) {
	const [w, s, e, n] = bbox;
	return [
		Math.max(w, -180),
		Math.max(s, -90),
		Math.min(e, 180),
		Math.min(n, 90)
	];
}
function round(value) {
	return Math.round(value * 1e6) / 1e6;
}
function textClause(form) {
	const text = form.text.trim();
	if (!text) return null;
	if (form.textMode === "lucene") return `(${text})`;
	const group = `(${text.split(/\s+/).filter(Boolean).map(escapeTerm).join(form.textMode === "any" ? " OR " : " AND ")})`;
	return form.field ? `${form.field}:${group}` : group;
}
function dateClause(form) {
	const from = form.dateFrom.trim();
	const to = form.dateTo.trim();
	if (!from && !to) return null;
	for (const value of [from, to]) if (value && !DATE_RE$1.test(value)) throw new Error(`Invalid date "${value}": use yyyy-mm-dd.`);
	return `${form.dateField}:[${from || "1900-01-01"} TO ${to || "2100-12-31"}]`;
}
/**
* Build the REST parameters for a form. Throws on invalid input (bad date or
* box), so callers can show the message instead of sending a query the
* catalogue would silently ignore (a malformed bbox returns the whole catalogue).
*/
/**
* A link to an ArcGIS REST service or layer (`…/rest/services/…/MapServer`,
* `…/MapServer/3`, with a query string or not), as a Lucene regular
* expression, which must match the whole link. A wildcard cannot say it: a
* `/` after the `*` does not parse, and `*MapServer*` also takes the WMS and
* WMTS under the service. 1,621 records on 2026-10-01.
*/
var ARCGIS_REST_PATTERN = "/http.*\\/rest\\/services\\/.*(Map|Image|Feature)Server(\\/[0-9]+)?\\/?(\\?.*)?/";
function buildQuery(form) {
	const clauses = [];
	const text = textClause(form);
	if (text) clauses.push(text);
	const keywords = splitList(form.keywords);
	if (keywords.length) clauses.push(`keywords_s:(${quotedOr(keywords)})`);
	const organisations = splitList(form.organisation).map(containsIgnoreCase);
	if (organisations.length) {
		const match = organisations.length === 1 ? organisations[0] : `(${organisations.join(" OR ")})`;
		clauses.push(`${form.invertOrganisation ? "NOT " : ""}EnteResponsabile_s:${match}`);
	}
	if (form.kind !== "services") {
		if (form.inspireThemes.length) clauses.push(`INSPIRETheme_s:(${quotedOr(form.inspireThemes)})`);
		if (form.openDataOnly) clauses.push("_exists_:isOpendata");
	}
	if (form.availableAs.length) {
		const patterns = form.availableAs.flatMap((kind) => {
			if (kind === "ArcGIS REST") return [ARCGIS_REST_PATTERN];
			const lower = kind.toLowerCase();
			return [
				lower,
				kind,
				`${lower[0].toUpperCase()}${lower.slice(1)}`
			].map((k) => `http*${k}*`);
		});
		clauses.push(`links_s:(${patterns.join(" OR ")})`);
	}
	const date = dateClause(form);
	if (date) clauses.push(date);
	if (form.kind === "data") clauses.push("apiso_Type_s:(dataset OR series)");
	else if (form.kind === "services") {
		clauses.push("apiso_Type_s:service");
		if (form.serviceTypes.length) clauses.push(`apiso_ServiceType_s:(${form.serviceTypes.join(" OR ")})`);
	}
	const built = { q: clauses.length ? clauses.join(" AND ") : null };
	if (form.bbox) {
		const error = bboxError(form.bbox);
		if (error) throw new Error(error);
		built.bbox = form.bbox.map(round).join(",");
		built.spatialRel = form.spatialRel;
	}
	if (form.sort) built.sort = form.sort;
	return built;
}
/**
* The text as an RNDT record id, or null. Ids are `<prefix>:<local part>`
* and can hold more colons (`r_basili:51db0c0e:15171e5a981:-78ae`): all 500
* of a sample had one, none had a space, quote or bracket (2026-10-01).
*/
function recordIdIn(text) {
	const t = text.trim();
	return /^[^\s:"()]+:[^\s"()]+$/.test(t) ? t : null;
}
/** A form that finds one record by id, whatever the other filters (`id:` finds nothing, `fileid:` does). */
function idForm(id) {
	return {
		...emptyForm(),
		textMode: "lucene",
		text: `fileid:"${escapePhrase(id)}"`
	};
}
/** REST parameters for a page of results (JSON format), in request order. */
function searchParams(form, start, num) {
	const built = buildQuery(form);
	const params = [];
	if (built.q) params.push(["q", built.q]);
	if (built.bbox) params.push(["bbox", built.bbox]);
	if (built.spatialRel) params.push(["spatialRel", built.spatialRel]);
	if (built.sort) params.push(["sort", built.sort]);
	params.push(["start", String(start)], ["num", String(num)], ["f", "json"]);
	return params;
}
function searchEndpoint(baseUrl) {
	return `${baseUrl.replace(/\/+$/, "")}/rest/metadata/search`;
}
/** Full search URL for a page of results (JSON format). */
function buildSearchUrl(baseUrl, form, start, num) {
	return `${searchEndpoint(baseUrl)}?${new URLSearchParams(searchParams(form, start, num)).toString()}`;
}
/** Single-quote a value for a POSIX shell. */
function shellQuote(value) {
	return `'${value.replace(/'/g, "'\\''")}'`;
}
/**
* A `curl` command that sends the same request as {@link buildSearchUrl}, for
* a POSIX shell. Values go through `--data-urlencode`, so the Lucene query
* stays readable instead of percent-encoded.
*/
function buildCurlCommand(baseUrl, form, start, num) {
	const lines = [`curl -sG ${shellQuote(searchEndpoint(baseUrl))}`];
	for (const [key, value] of searchParams(form, start, num)) lines.push(`--data-urlencode ${shellQuote(`${key}=${value}`)}`);
	return lines.join(" \\\n  ");
}
//#endregion
//#region src/rndt/ogc.ts
var OPERATION_PARAMS = new Set([
	"service",
	"request",
	"version",
	"acceptversions",
	"layers",
	"layer",
	"typename",
	"typenames",
	"outputformat",
	"srs",
	"crs",
	"srsname",
	"bbox",
	"width",
	"height",
	"format",
	"styles",
	"count",
	"maxfeatures",
	"startindex"
]);
function localName$1(el) {
	return el.localName || el.tagName.split(":").pop() || "";
}
function childElements(el, name) {
	return Array.from(el.children).filter((c) => !name || localName$1(c) === name);
}
function firstChild(el, name) {
	return el ? childElements(el, name)[0] ?? null : null;
}
function descendants(el, name) {
	return Array.from(el.getElementsByTagName("*")).filter((c) => localName$1(c) === name);
}
function text$1(el) {
	return (el?.textContent ?? "").trim();
}
function href(el) {
	if (!el) return "";
	return (el.getAttributeNS("http://www.w3.org/1999/xlink", "href") ?? el.getAttribute("xlink:href") ?? el.getAttribute("onlineResource") ?? "").trim();
}
function parse(xml) {
	const doc = new DOMParser().parseFromString(xml, "application/xml");
	return doc.getElementsByTagName("parsererror").length ? null : doc;
}
/**
* Repair the two faults seen in real capabilities documents: a DOCTYPE with an
* internal subset, and namespace prefixes used without a declaration (e.g.
* `inspire_vs:` in some MapServer WMS 1.1.1). Undeclared prefixes get a
* placeholder namespace on the root element.
*/
function repairXml(xml) {
	const withoutDoctype = xml.replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/i, "");
	const declared = new Set(Array.from(withoutDoctype.matchAll(/xmlns:([\w.-]+)\s*=/g), (m) => m[1]));
	const used = new Set(Array.from(withoutDoctype.matchAll(/<\/?([\w.-]+):[\w.-]+|\s([\w.-]+):[\w.-]+\s*=/g), (m) => m[1] ?? m[2]));
	const missing = Array.from(used).filter((p) => p && p !== "xml" && p !== "xmlns" && !declared.has(p));
	if (!missing.length) return withoutDoctype;
	const decls = missing.map((p) => ` xmlns:${p}="urn:x-undeclared:${p}"`).join("");
	return withoutDoctype.replace(/<([A-Za-z_][\w.:-]*)/, (m) => `${m}${decls}`);
}
/** Parse XML, turning OGC exception reports into errors. */
function parseXml(xml) {
	const doc = parse(xml) ?? parse(repairXml(xml));
	if (!doc) throw new Error("The service did not return valid XML.");
	const root = doc.documentElement;
	const rootName = root ? localName$1(root) : "";
	if (rootName === "ServiceExceptionReport" || rootName === "ExceptionReport") throw new Error(`Service error: ${text$1(root).slice(0, 300)}`);
	return doc;
}
/** Name of a layer/feature type preselected by the resource URL, if any. */
function preselectedName(url) {
	try {
		const params = new URL(url).searchParams;
		for (const [key, value] of params) if ([
			"layers",
			"layer",
			"typename",
			"typenames"
		].includes(key.toLowerCase()) && value) return value.split(",")[0];
	} catch {}
	return null;
}
/** Base endpoint of an OGC URL: the same URL without operation parameters. */
function serviceBaseUrl(url) {
	const parsed = new URL(url);
	for (const key of Array.from(parsed.searchParams.keys())) if (OPERATION_PARAMS.has(key.toLowerCase())) parsed.searchParams.delete(key);
	return parsed.toString().replace(/\?$/, "");
}
/**
* The WMS GetStyles that returns the SLD a server draws a feature type with.
* GeoServer publishes the same layer as WFS and WMS, at `…/wfs` and `…/wms`
* (`…/ows` serves both); a server without that WMS answers no SLD.
*/
function getStylesUrl(getFeatureUrl, typeName) {
	const url = new URL(serviceBaseUrl(getFeatureUrl));
	url.pathname = url.pathname.replace(/\/wfs$/i, "/wms");
	for (const [key, value] of [
		["SERVICE", "WMS"],
		["VERSION", "1.1.1"],
		["REQUEST", "GetStyles"],
		["LAYERS", typeName]
	]) url.searchParams.set(key, value);
	return url.toString();
}
/**
* When the capabilities document was fetched over HTTPS, an operation URL it
* declares as `http://` on the same host is upgraded too: servers that moved to
* HTTPS often keep old `OnlineResource` values.
*/
function upgradeToHttps(target, fetchedFrom) {
	try {
		const t = new URL(target);
		const f = new URL(fetchedFrom);
		if (f.protocol === "https:" && t.protocol === "http:" && t.hostname === f.hostname) {
			t.protocol = "https:";
			return t.toString();
		}
	} catch {}
	return target;
}
function capabilitiesUrl(url, service) {
	const parsed = new URL(serviceBaseUrl(url));
	parsed.searchParams.set("SERVICE", service);
	parsed.searchParams.set("REQUEST", "GetCapabilities");
	return parsed.toString();
}
function parseBoxNumbers(values) {
	const box = values.map((v) => Number(v));
	return values.every((v) => v !== null && v !== "") && box.every((v) => Number.isFinite(v)) ? box : null;
}
function wmsLayerBbox(layer) {
	const geo = firstChild(layer, "EX_GeographicBoundingBox");
	if (geo) return parseBoxNumbers([
		"westBoundLongitude",
		"southBoundLatitude",
		"eastBoundLongitude",
		"northBoundLatitude"
	].map((n) => text$1(firstChild(geo, n))));
	const ll = firstChild(layer, "LatLonBoundingBox");
	if (ll) return parseBoxNumbers([
		"minx",
		"miny",
		"maxx",
		"maxy"
	].map((a) => ll.getAttribute(a)));
	return null;
}
function parseWmsCapabilities(xml, requestUrl) {
	const doc = parseXml(xml);
	const version = doc.documentElement.getAttribute("version") ?? "1.3.0";
	const getMap = descendants(doc, "GetMap")[0];
	const getMapUrl = href(getMap ? descendants(getMap, "OnlineResource")[0] : null) || serviceBaseUrl(requestUrl);
	const layers = [];
	const walk = (layer, inheritedCrs, inheritedBbox) => {
		const own = [...childElements(layer, "CRS"), ...childElements(layer, "SRS")].flatMap((el) => text$1(el).split(/\s+/)).filter(Boolean);
		const crs = Array.from(new Set([...inheritedCrs, ...own]));
		const bbox = wmsLayerBbox(layer) ?? inheritedBbox;
		const name = text$1(firstChild(layer, "Name"));
		const children = childElements(layer, "Layer");
		if (name) layers.push({
			name,
			title: text$1(firstChild(layer, "Title")) || name,
			crs,
			bbox,
			group: children.length > 0
		});
		for (const child of children) walk(child, crs, bbox);
	};
	const capability = descendants(doc, "Capability")[0];
	for (const top of capability ? childElements(capability, "Layer") : []) walk(top, [], null);
	return {
		version,
		getMapUrl: serviceBaseUrl(stripQueryEnd(getMapUrl)),
		layers
	};
}
/** GeoLibre's plugin `addWmsLayer` requests Web Mercator tiles unless it is given a `crs`. */
function supportsWebMercator(layer) {
	return layer.crs.some((c) => /^EPSG:(3857|900913)$/i.test(c));
}
/**
* The extent to give a WMS layer added from a record: GeoLibre asks tiles
* only inside it and zooms to it from the Layers panel. A national service
* declares the whole country (the cadastral WMS: 2..19 E, 33..48 N) while the
* catalogue has one dataset record per municipality: then the record's own
* extent, when it lies inside the layer's. Otherwise the layer's, if valid.
*/
function wmsLayerBounds(layerBbox, recordBbox, recordType) {
	const layer = layerBbox && !bboxError(layerBbox) ? layerBbox : void 0;
	if (!layer || recordType !== "dataset" || !recordBbox || bboxError(recordBbox)) return layer;
	return recordBbox[0] >= layer[0] && recordBbox[1] >= layer[1] && recordBbox[2] <= layer[2] && recordBbox[3] <= layer[3] ? recordBbox : layer;
}
/** Geographic systems GeoLibre Desktop redraws into Web Mercator (its `GEOGRAPHIC_WMS_CRS`). */
var GEOGRAPHIC_CRS = [
	"EPSG:4326",
	"EPSG:4258",
	"EPSG:6706",
	"CRS:84"
];
/**
* The system to ask a layer in when it does not offer EPSG:3857, for
* `addWmsLayer`'s `crs` (GeoLibre 3.2.0): a geographic one the layer lists
* (CRS:84 only with WMS 1.3.0), otherwise its first `EPSG:<code>`; in the
* layer's own order, which starts from its native system. Null when it lists
* none of them.
*/
function pickWmsCrs(layer, version) {
	const listed = layer.crs.map((c) => c.toUpperCase());
	const v13 = version.startsWith("1.3");
	return listed.find((c) => GEOGRAPHIC_CRS.includes(c) && (c !== "CRS:84" || v13)) ?? listed.find((c) => /^EPSG:\d+$/.test(c) && !/^EPSG:(3857|900913)$/.test(c)) ?? null;
}
function stripQueryEnd(url) {
	return url.replace(/[?&]+$/, "");
}
function parseWfsCapabilities(xml, requestUrl) {
	const doc = parseXml(xml);
	const version = doc.documentElement.getAttribute("version") ?? "2.0.0";
	let getFeatureUrl = "";
	const outputFormats = [];
	for (const op of descendants(doc, "Operation")) {
		if (op.getAttribute("name") !== "GetFeature") continue;
		getFeatureUrl = href(descendants(op, "Get")[0]);
		for (const param of childElements(op, "Parameter")) {
			if (param.getAttribute("name")?.toLowerCase() !== "outputformat") continue;
			outputFormats.push(...descendants(param, "Value").map((v) => text$1(v)));
		}
	}
	if (!getFeatureUrl) {
		const legacy = descendants(doc, "GetFeature")[0];
		if (legacy) {
			getFeatureUrl = href(descendants(legacy, "Get")[0]);
			const formats = firstChild(legacy, "ResultFormat");
			if (formats) outputFormats.push(...childElements(formats).map((f) => localName$1(f)));
		}
	}
	const featureTypes = [];
	for (const ft of descendants(doc, "FeatureType")) {
		const name = text$1(firstChild(ft, "Name"));
		if (!name) continue;
		let bbox = null;
		const wgs = firstChild(ft, "WGS84BoundingBox");
		if (wgs) {
			const lower = text$1(firstChild(wgs, "LowerCorner")).split(/\s+/);
			const upper = text$1(firstChild(wgs, "UpperCorner")).split(/\s+/);
			bbox = parseBoxNumbers([
				lower[0],
				lower[1],
				upper[0],
				upper[1]
			]);
		} else {
			const ll = firstChild(ft, "LatLongBoundingBox");
			if (ll) bbox = parseBoxNumbers([
				"minx",
				"miny",
				"maxx",
				"maxy"
			].map((a) => ll.getAttribute(a)));
		}
		for (const format of descendants(ft, "Format")) outputFormats.push(text$1(format));
		featureTypes.push({
			name,
			title: text$1(firstChild(ft, "Title")) || name,
			bbox
		});
	}
	return {
		version,
		getFeatureUrl: serviceBaseUrl(stripQueryEnd(getFeatureUrl || requestUrl)),
		outputFormats: Array.from(new Set(outputFormats.filter(Boolean))),
		featureTypes
	};
}
function tokens(value) {
	return new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((t) => t.length > 2));
}
/**
* The layer whose name or title shares most words with the record title, used
* to preselect a layer when the record's link does not name one. Null when no
* layer shares at least one word.
*/
function bestMatchingLayer(title, layers) {
	const wanted = tokens(title);
	let best = null;
	let bestScore = 0;
	for (const layer of layers) {
		const have = tokens(`${layer.name} ${layer.title}`);
		let score = 0;
		for (const t of wanted) if (have.has(t)) score++;
		if (score > bestScore) {
			best = layer.name;
			bestScore = score;
		}
	}
	return best;
}
/**
* The WMS of an ArcGIS service, from its WMTS link: ArcGIS publishes
* `<site>/rest/services/<path>/<MapServer|ImageServer>/WMTS` and, when the WMS
* capability is on, `<site>/services/<path>/<MapServer|ImageServer>/WMSServer`.
* Null for any other URL.
*/
function arcgisWmsFromWmts(url) {
	const match = /^(https?:\/\/[^?#]+?)\/rest\/services\/(.+?)\/(MapServer|ImageServer)\/WMTS(?:[/?#]|$)/i.exec(url);
	return match ? `${match[1]}/services/${match[2]}/${match[3]}/WMSServer` : null;
}
/** A 4 km square in EPSG:3857 at the centre of `bbox` (WGS84), as `minx,miny,maxx,maxy`. */
function probeBbox3857(bbox) {
	const [w, s, e, n] = bbox ?? [
		12,
		41.5,
		13,
		42.5
	];
	const lon = (w + e) / 2;
	const lat = Math.max(-85, Math.min(85, (s + n) / 2));
	const x = lon * 20037508.34 / 180;
	const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * (20037508.34 / 180);
	const half = 2e3;
	return [
		x - half,
		y - half,
		x + half,
		y + half
	].map((v) => v.toFixed(2)).join(",");
}
/**
* A GetMap for a small tile at the centre of `bbox` (WGS84), to test whether
* a server draws a layer in EPSG:3857 when it does not declare it (ArcGIS
* servers often serve it anyway), or what it answers in a geographic `crs`.
*/
function probeGetMapUrl(getMapUrl, version, layer, bbox, crs = "EPSG:3857") {
	const v13 = version.startsWith("1.3");
	let box = probeBbox3857(bbox);
	if (crs !== "EPSG:3857") {
		const [w, s, e, n] = bbox ?? [
			12,
			41.5,
			13,
			42.5
		];
		const [lon, lat] = [(w + e) / 2, (s + n) / 2];
		const half = .02;
		box = (v13 && crs !== "CRS:84" ? [
			lat - half,
			lon - half,
			lat + half,
			lon + half
		] : [
			lon - half,
			lat - half,
			lon + half,
			lat + half
		]).map((v) => v.toFixed(5)).join(",");
	}
	const url = new URL(getMapUrl);
	const params = [
		["SERVICE", "WMS"],
		["VERSION", v13 ? "1.3.0" : "1.1.1"],
		["REQUEST", "GetMap"],
		["LAYERS", layer],
		["STYLES", ""],
		[v13 ? "CRS" : "SRS", crs],
		["BBOX", box],
		["WIDTH", String(64)],
		["HEIGHT", String(64)],
		["FORMAT", "image/png"],
		["TRANSPARENT", "true"]
	];
	for (const [key, value] of params) url.searchParams.set(key, value);
	return url.toString();
}
/** Best GeoJSON output format the WFS advertises, or null. */
function pickJsonFormat(formats) {
	const lower = formats.map((f) => f.toLowerCase());
	const exact = lower.indexOf("application/json");
	if (exact >= 0) return formats[exact];
	const geojson = lower.findIndex((f) => f.includes("geojson"));
	if (geojson >= 0) return formats[geojson];
	const json = lower.findIndex((f) => f.includes("json"));
	return json >= 0 ? formats[json] : null;
}
/**
* GetFeature URL for GeoJSON in WGS84. With `bbox`, only features in that box
* are requested (needed by services such as the cadastral WFS, which refuse
* requests without one).
*/
function buildGetFeatureUrl(caps, typeName, options) {
	const url = new URL(caps.getFeatureUrl);
	const set = (key, value) => url.searchParams.set(key, value);
	const v = caps.version;
	set("SERVICE", "WFS");
	set("REQUEST", "GetFeature");
	set("VERSION", v);
	set("OUTPUTFORMAT", options.format);
	if (v.startsWith("2.")) {
		set("TYPENAMES", typeName);
		set("COUNT", String(options.maxFeatures));
	} else {
		set("TYPENAME", typeName);
		set("MAXFEATURES", String(options.maxFeatures));
	}
	if (v.startsWith("1.0")) {
		set("SRSNAME", "EPSG:4326");
		if (options.bbox) set("BBOX", options.bbox.join(","));
	} else {
		set("SRSNAME", "urn:ogc:def:crs:EPSG::4326");
		if (options.bbox) {
			const [w, s, e, n] = options.bbox;
			set("BBOX", `${s},${w},${n},${e},urn:ogc:def:crs:EPSG::4326`);
		}
	}
	return url.toString();
}
/**
* GetFeature URL that asks only how many features match (`resultType=hits`),
* or null for WFS 1.0.0, which has no such request.
*/
function buildHitsUrl(caps, typeName, bbox) {
	if (caps.version.startsWith("1.0")) return null;
	const url = new URL(buildGetFeatureUrl(caps, typeName, {
		format: "",
		maxFeatures: 0,
		bbox
	}));
	for (const key of [
		"OUTPUTFORMAT",
		"COUNT",
		"MAXFEATURES"
	]) url.searchParams.delete(key);
	url.searchParams.set("RESULTTYPE", "hits");
	return url.toString();
}
/**
* Feature count from a `resultType=hits` answer: `numberMatched` (WFS 2.0) or
* `numberOfFeatures` (1.1). Null when missing or "unknown".
*/
function parseHitsCount(xml) {
	const match = /\snumberMatched="(\d+)"/.exec(xml) ?? /\snumberOfFeatures="(\d+)"/.exec(xml);
	return match ? Number(match[1]) : null;
}
function firstPosition(geometry) {
	if (!geometry) return null;
	if (geometry.type === "GeometryCollection") {
		for (const g of geometry.geometries) {
			const p = firstPosition(g);
			if (p) return p;
		}
		return null;
	}
	let coords = geometry.coordinates;
	while (Array.isArray(coords) && Array.isArray(coords[0])) coords = coords[0];
	return Array.isArray(coords) && typeof coords[0] === "number" ? coords : null;
}
function swapPositions(coords) {
	if (Array.isArray(coords) && typeof coords[0] === "number") {
		const [a, b, ...rest] = coords;
		return [
			b,
			a,
			...rest
		];
	}
	return Array.isArray(coords) ? coords.map(swapPositions) : coords;
}
function swapGeometry(geometry) {
	if (!geometry) return geometry;
	if (geometry.type === "GeometryCollection") return {
		...geometry,
		geometries: geometry.geometries.map((g) => swapGeometry(g))
	};
	return {
		...geometry,
		coordinates: swapPositions(geometry.coordinates)
	};
}
/**
* Servers disagree on the axis order of EPSG:4326 in GeoJSON. For Italian data
* the two orders are easy to tell apart: longitude is 6..19, latitude 35..48.
* When the first coordinate looks like (lat, lon), swap every position.
*/
function fixAxisOrder(fc) {
	const first = fc.features.map((f) => firstPosition(f.geometry)).find(Boolean);
	if (!first) return fc;
	const [x, y] = first;
	if (!(x >= 35 && x <= 48 && y >= 6 && y <= 19)) return fc;
	return {
		...fc,
		features: fc.features.map((f) => ({
			...f,
			geometry: swapGeometry(f.geometry)
		}))
	};
}
//#endregion
//#region src/rndt/project-state.ts
var KINDS = [
	"all",
	"data",
	"services"
];
var TEXT_MODES$2 = [
	"all",
	"any",
	"lucene"
];
var SPATIAL_RELS$1 = ["Intersects", "Within"];
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var strings = (value) => Array.isArray(value) && value.every((v) => typeof v === "string") ? value : null;
/**
* Read a saved state. A project file can be edited by anyone: a value of the
* wrong type falls back to the form's default, a state of another version or
* shape gives null.
*/
function parsePanelState(raw) {
	if (!isObject(raw) || raw.v !== 1 || !isObject(raw.form)) return null;
	const saved = raw.form;
	const form = emptyForm();
	const target = form;
	for (const key of [
		"text",
		"field",
		"keywords",
		"organisation",
		"dateField",
		"dateFrom",
		"dateTo",
		"sort"
	]) if (typeof saved[key] === "string") target[key] = saved[key];
	for (const key of ["invertOrganisation", "openDataOnly"]) if (typeof saved[key] === "boolean") target[key] = saved[key];
	for (const key of [
		"serviceTypes",
		"availableAs",
		"inspireThemes"
	]) {
		const list = strings(saved[key]);
		if (list) target[key] = list;
	}
	if (KINDS.includes(saved.kind)) target.kind = saved.kind;
	if (TEXT_MODES$2.includes(saved.textMode)) target.textMode = saved.textMode;
	if (SPATIAL_RELS$1.includes(saved.spatialRel)) target.spatialRel = saved.spatialRel;
	if (Array.isArray(saved.bbox) && !bboxError(saved.bbox)) form.bbox = saved.bbox;
	return {
		v: 1,
		form,
		start: Number.isInteger(raw.start) && raw.start >= 1 ? raw.start : 1,
		recordId: typeof raw.recordId === "string" && raw.recordId ? raw.recordId : null
	};
}
//#endregion
//#region src/rndt/history.ts
/**
* The recent searches of the panel: whole searches (text and filters, with the
* box the search used) and records opened by id, newest first. They live in the
* webview's localStorage, per user and per computer, never in a project.
*/
var HISTORY_KEY = `${PLUGIN_ID}:history`;
/**
* The same record, or the same text and filters: the area is left out, or
* "Map view" searched again after moving the map would fill the list with
* entries that look the same.
*/
function sameSearch(a, b) {
	if (a.kind !== b.kind) return false;
	if (a.kind === "record") return a.recordId === b.recordId;
	return JSON.stringify({
		...a.form,
		bbox: null
	}) === JSON.stringify({
		...b.form,
		bbox: null
	});
}
/** The list with an entry on top: an older copy of the same search leaves, the oldest past the limit too. */
function withEntry(list, entry) {
	return [entry, ...list.filter((e) => !sameSearch(e, entry))].slice(0, 20);
}
/** The list with its first entry replaced: for a change of the search on screen (a page, the order, a filter removed). */
function withTopUpdated(list, entry) {
	return withEntry(list.slice(1), entry);
}
function withoutEntry(list, entry) {
	return list.filter((e) => e !== entry);
}
function storage$1() {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}
/** Read the stored list. It can be edited by hand: what cannot be read is dropped. */
function loadHistory() {
	let stored;
	try {
		stored = JSON.parse(storage$1()?.getItem(HISTORY_KEY) ?? "null");
	} catch {
		return [];
	}
	if (!Array.isArray(stored)) return [];
	const list = [];
	for (const raw of stored) {
		const state = parsePanelState({
			v: 1,
			form: raw?.form
		});
		if (!state) continue;
		const item = raw;
		const recordId = item.kind === "record" && typeof item.recordId === "string" && item.recordId ? item.recordId : null;
		list.push({
			kind: recordId ? "record" : "search",
			form: state.form,
			filters: Array.isArray(item.filters) ? item.filters.filter((f) => typeof f === "string") : [],
			recordId,
			title: typeof item.title === "string" ? item.title : "",
			total: typeof item.total === "number" && item.total >= 0 ? item.total : 0,
			time: typeof item.time === "string" && !Number.isNaN(Date.parse(item.time)) ? item.time : (/* @__PURE__ */ new Date(0)).toISOString()
		});
	}
	return list.slice(0, 20);
}
function saveHistory(list) {
	try {
		storage$1()?.setItem(HISTORY_KEY, JSON.stringify(list));
	} catch {}
}
function clearHistory() {
	try {
		storage$1()?.removeItem(HISTORY_KEY);
	} catch {}
}
/** Whether an entry holds the letters typed, in its text, title, id or filters. */
function matchesEntry(entry, query) {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return [
		entry.kind === "record" ? "" : entry.form.text,
		entry.title,
		entry.recordId ?? "",
		...entry.filters
	].join(" ").toLowerCase().includes(q);
}
var pad = (n) => String(n).padStart(2, "0");
/** "15:42" today, "Yesterday", then the date, in the time of the computer. */
function whenLabel(time, now = /* @__PURE__ */ new Date()) {
	const then = new Date(time);
	const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const days = Math.round((day(now) - day(then)) / 864e5);
	if (days <= 0) return `${pad(then.getHours())}:${pad(then.getMinutes())}`;
	if (days === 1) return "Yesterday";
	return `${then.getFullYear()}-${pad(then.getMonth() + 1)}-${pad(then.getDate())}`;
}
//#endregion
//#region src/rndt/url-params.ts
/**
* The query parameters the plugin owns in a GeoLibre link, e.g.
* `…/?rndt=idrografia&rndtKind=services&rndtTheme=hy`. GeoLibre activates the
* plugin when one is in the address and hands them to `handleUrlParameters`.
* Names are case-sensitive and public once a link is shared: do not rename
* them. Each holds one field of the search form (#30).
*/
var TEXT_PARAM = "rndt";
var BBOX_PARAM = "rndtBbox";
/** Short, stable names for the values of a few fields, as a link writes them. */
var FIELDS = {
	title: "title",
	abstract: "description",
	lineage: "apiso_Lineage_txt",
	limitation: "apiso_AccessConstraints_s"
};
var DATE_FIELDS = {
	revision: "apiso_RevisionDate_dt",
	publication: "apiso_PublicationDate_dt",
	creation: "apiso_CreationDate_dt",
	catalogue: "sys_created_dt"
};
var SORTS = {
	title: "title:asc",
	"title-desc": "title:desc",
	newest: "apiso_Modified_dt:desc",
	oldest: "apiso_Modified_dt:asc"
};
var LINK_KINDS$1 = [
	"WMS",
	"WFS",
	"ArcGIS REST"
];
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var keyOf = (map, value) => Object.keys(map).find((key) => map[key] === value) ?? "";
var list = (raw) => raw.split(",").map((item) => item.trim()).filter(Boolean);
var isTrue = (raw) => /^(1|true|yes)$/i.test(raw);
var isFalse = (raw) => /^(0|false|no)$/i.test(raw);
function mapped(name, map, field) {
	return {
		name,
		read: (raw, form) => {
			const value = map[raw.toLowerCase()];
			if (value === void 0) return `not one of ${Object.keys(map).join(", ")}`;
			form[field] = value;
			return null;
		},
		write: (form) => keyOf(map, form[field])
	};
}
function flag(name, field) {
	return {
		name,
		read: (raw, form) => {
			if (isTrue(raw)) form[field] = true;
			else if (!isFalse(raw)) return "not 1 or 0";
			return null;
		},
		write: (form) => form[field] ? "1" : ""
	};
}
function text(name, field) {
	return {
		name,
		read: (raw, form) => {
			form[field] = raw;
			return null;
		},
		write: (form) => form[field].trim()
	};
}
function date(name, field) {
	return {
		name,
		read: (raw, form) => {
			if (!DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) return "not a yyyy-mm-dd date";
			form[field] = raw;
			return null;
		},
		write: (form) => form[field]
	};
}
var PARAMS = [
	text(TEXT_PARAM, "text"),
	{
		name: BBOX_PARAM,
		read: (raw, form) => {
			const box = raw.split(/[\s,;]+/).filter(Boolean).map(Number);
			const error = bboxError(box);
			if (error) return error;
			form.bbox = box;
			return null;
		},
		write: (form) => form.bbox ? form.bbox.join(",") : ""
	},
	{
		name: "rndtWithin",
		read: (raw, form) => {
			if (isTrue(raw)) form.spatialRel = "Within";
			else if (!isFalse(raw)) return "not 1 or 0";
			return null;
		},
		write: (form) => form.bbox && form.spatialRel === "Within" ? "1" : ""
	},
	{
		name: "rndtKind",
		read: (raw, form) => {
			const kind = raw.toLowerCase();
			if (kind !== "data" && kind !== "services" && kind !== "all") return "not data, services or all";
			form.kind = kind;
			return null;
		},
		write: (form) => form.kind === "all" ? "" : form.kind
	},
	{
		name: "rndtService",
		read: (raw, form) => {
			const known = SERVICE_TYPES$1.map((option) => option.value);
			const values = list(raw.toLowerCase());
			const unknown = values.filter((value) => !known.includes(value));
			form.serviceTypes = values.filter((value) => known.includes(value));
			return unknown.length ? `unknown ${unknown.join(", ")}` : null;
		},
		write: (form) => form.serviceTypes.join(",")
	},
	{
		name: "rndtAs",
		read: (raw, form) => {
			const values = list(raw);
			const kinds = values.map((value) => LINK_KINDS$1.find((kind) => kind.toLowerCase() === value.toLowerCase() || kind === "ArcGIS REST" && /^arcgis$/i.test(value))).filter((kind) => kind !== void 0);
			form.availableAs = [...new Set(kinds)];
			return kinds.length < values.length ? `not all of ${LINK_KINDS$1.join(", ")}` : null;
		},
		write: (form) => form.availableAs.join(",")
	},
	{
		name: "rndtMode",
		read: (raw, form) => {
			const mode = raw.toLowerCase();
			if (mode !== "all" && mode !== "any" && mode !== "lucene") return "not all, any or lucene";
			form.textMode = mode;
			return null;
		},
		write: (form) => form.textMode === "all" ? "" : form.textMode
	},
	mapped("rndtField", FIELDS, "field"),
	text("rndtKeywords", "keywords"),
	text("rndtOrg", "organisation"),
	flag("rndtOrgNot", "invertOrganisation"),
	{
		name: "rndtTheme",
		read: (raw, form) => {
			const codes = list(raw.toLowerCase());
			const label = codes.map((code) => INSPIRE_THEME_CODES[code]).find(Boolean);
			if (!label) return "not an INSPIRE theme code (hy, cp, au, …)";
			form.inspireThemes = [label];
			return codes.length > 1 ? "only the first theme is used" : null;
		},
		write: (form) => keyOf(INSPIRE_THEME_CODES, form.inspireThemes[0] ?? "")
	},
	flag("rndtOpen", "openDataOnly"),
	{
		name: "rndtDate",
		read: (raw, form) => {
			const value = DATE_FIELDS[raw.toLowerCase()];
			if (value === void 0) return `not one of ${Object.keys(DATE_FIELDS).join(", ")}`;
			form.dateField = value;
			return null;
		},
		write: (form) => (form.dateFrom || form.dateTo) && form.dateField !== emptyForm().dateField ? keyOf(DATE_FIELDS, form.dateField) : ""
	},
	date("rndtFrom", "dateFrom"),
	date("rndtTo", "dateTo"),
	mapped("rndtSort", SORTS, "sort")
];
var URL_PARAMETER_NAMES = PARAMS.map((param) => param.name);
/**
* Read the search a link asks for, or null when it asks for none (`?rndt`
* with no value only opens the panel). The form starts empty, so the same link
* gives the same search to everyone. Anyone can write a link: a value that is
* not valid is left out with a warning, the rest is still searched.
*/
function linkSearchFrom(params) {
	const form = emptyForm();
	let asked = false;
	for (const param of PARAMS) {
		const raw = (params.get(param.name) ?? "").trim();
		if (!raw) continue;
		asked = true;
		const error = param.read(raw, form);
		if (error) console.warn(`[openrndt-geolibre] Ignoring ${param.name}=${raw} in the link: ${error}`);
	}
	return asked ? { form } : null;
}
/** The link parameters of a search: one per field that is not at its default, in a fixed order. */
function paramsFromForm(form) {
	const params = new URLSearchParams();
	for (const param of PARAMS) {
		const value = param.write(form);
		if (value) params.set(param.name, value);
	}
	return params;
}
/** Where a shared link opens: GeoLibre web, the one address every recipient can open, also from Desktop. */
var SHARE_BASE_URL = "https://web.geolibre.app/";
/** The registry id `?plugin=` installs; the development copy is not in the registry, so it shares this too. */
var SHARE_PLUGIN_ID = "openrndt-geolibre";
/**
* The link that gives someone else this search (#31): GeoLibre web with
* `?plugin=` (it installs the plugin where it is missing, after the trust
* prompt, on GeoLibre after 3.2.0) and the search's parameters. With a record
* open the link opens that record, as `?rndt=<id>` does.
*/
function shareUrl(form, recordId) {
	const params = recordId ? new URLSearchParams({ [TEXT_PARAM]: recordId }) : paramsFromForm(form);
	const query = new URLSearchParams({ plugin: SHARE_PLUGIN_ID });
	for (const [name, value] of params) query.set(name, value);
	return `${SHARE_BASE_URL}?${query}`;
}
//#endregion
//#region src/rndt/agent-text.ts
/**
* "Copy for an agent": a search made in the panel as Markdown, to hand to an
* AI agent (or to a colleague): what was searched, in words and numbers, the
* request that repeats it, the records of the page and how to go on outside
* GeoLibre. Structure in English, the catalogue's content in Italian.
*/
var TEXT_MODES$1 = {
	all: "all words",
	any: "any word",
	lucene: "Lucene syntax"
};
function labelOf(options, value) {
	return options.find((o) => o.value === value)?.label ?? value;
}
/** The filters of a form, one row each, in words: what the chips of the panel say, with the numbers. */
function filterRows(form) {
	const rows = [];
	const text = form.text.trim();
	if (text) {
		const where = form.field ? `in: ${labelOf(SEARCH_FIELDS, form.field)}` : "anywhere in the record";
		rows.push(`Text: ${text} (${TEXT_MODES$1[form.textMode]}${form.textMode === "lucene" ? "" : `, ${where}`})`);
	}
	if (form.kind === "data") rows.push("Type: data (datasets and series)");
	if (form.kind === "services") {
		const types = form.serviceTypes.map((t) => labelOf(SERVICE_TYPES$1, t));
		rows.push(`Type: services${types.length ? ` (${types.join(", ")})` : ""}`);
	}
	if (form.bbox) {
		const rel = form.spatialRel === "Within" ? "records entirely inside it" : "records that touch it";
		rows.push(`Area: bbox ${form.bbox.join(",")} (west,south,east,north, EPSG:4326), ${rel}`);
	}
	if (form.availableAs.length) rows.push(`Available as: ${form.availableAs.join(" or ")}`);
	if (form.kind !== "services") {
		if (form.inspireThemes.length) rows.push(`INSPIRE theme: ${form.inspireThemes.join(", ")}`);
		if (form.openDataOnly) rows.push("Open data only: records whose publisher filled in the open data field");
	}
	if (form.keywords.trim()) rows.push(`Keywords (exact): ${form.keywords.trim()}`);
	if (form.organisation.trim()) rows.push(`Organisation ${form.invertOrganisation ? "left out" : "kept"} (name contains): ${form.organisation.trim()}`);
	if (form.dateFrom || form.dateTo) rows.push(`${labelOf(DATE_FIELDS$1, form.dateField)} date: from ${form.dateFrom || "any"} to ${form.dateTo || "any"}`);
	rows.push(`Sort: ${form.sort ? labelOf(SORT_OPTIONS, form.sort) : "relevance"}`);
	return rows;
}
/** A value inside a Markdown table cell. */
function cell(value) {
	return value.replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
}
function agentText(page, now = /* @__PURE__ */ new Date()) {
	const { form, records, total, start, num } = page;
	const text = form.text.trim();
	const end = start + records.length - 1;
	const base = RNDT_BASE_URL.replace(/\/+$/, "");
	return [
		text ? `# RNDT search: "${text}"` : "# RNDT search",
		"",
		"RNDT (Repertorio Nazionale dei Dati Territoriali) is the Italian national catalogue of geospatial metadata, run by AgID. Records are ISO 19115 metadata of datasets and services published by Italian public bodies; their content is in Italian.",
		"",
		`Search made in the openrndt-geolibre panel (GeoLibre), ${now.toISOString().slice(0, 16).replace("T", " ")} UTC:`,
		...filterRows(form).map((row) => `- ${row}`),
		`- Results: ${total.toLocaleString("en")}; this is page ${Math.floor((start - 1) / num) + 1} (records ${start}-${end})`,
		"",
		"## Same request",
		"",
		"```sh",
		buildCurlCommand(RNDT_BASE_URL, form, start, num),
		"```",
		"",
		`- Next page: start=${start + num}, then steps of ${num}. A larger num gives more records in one answer.`,
		"- One record: q=fileid:\"<id>\", with no other filter.",
		`- ISO XML of a record: ${base}/rest/metadata/item/<id>/xml (the id URL-encoded)`,
		"",
		"## Results on this page",
		"",
		"| id | title | organisation | available as |",
		"|---|---|---|---|",
		...records.map((r) => {
			const kinds = Array.from(new Set(r.services.map((s) => s.kind)));
			return `| ${cell(r.id)} | ${cell(r.title)} | ${cell(r.organisation)} | ${cell(kinds.join(", "))} |`;
		}),
		"",
		"## Going further",
		"",
		"openrndt is a command line tool for the same catalogue (https://github.com/ondata/openrndt): many records as CSV or JSON, footprints as GeoJSON, a record in full, the services of a record checked. If it is installed, prefer it to raw requests."
	].join("\n");
}
//#endregion
//#region src/rndt/records.ts
var NON_RESOURCE_RELS = new Set([
	"alternate",
	"icon",
	"self"
]);
var DOWNLOAD_EXTENSIONS = [
	".csv",
	".geojson",
	".gpkg",
	".gz",
	".json",
	".jsonl",
	".kml",
	".kmz",
	".pdf",
	".shp",
	".tif",
	".tiff",
	".tsv",
	".xml",
	".zip"
];
function asObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asString(value) {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join("; ");
	return "";
}
function asStringList(value) {
	if (typeof value === "string") return [value];
	if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
	return [];
}
/**
* The addresses in a contact field. Placeholders such as "ad@min" (2 records
* out of 400 sampled on 2026-09-30) are dropped: no domain, no mail.
*/
function parseEmails(value) {
	const found = asStringList(value).flatMap((v) => v.split(/[\s,;]+/));
	return Array.from(new Set(found.filter((v) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v))));
}
/**
* The catalogue calls "MapServer" both an ArcGIS REST service and the WMTS or
* WCS under it (`…/MapServer/WMTS/1.0.0/WMTSCapabilities.xml`): for such a
* kind the URL tells which one it is. The SOAP endpoint (`…/services/…/
* MapServer`, no `rest`) keeps the catalogue's name.
*/
function arcgisKind(kind, url) {
	if (!/^(?:Map|Image|Feature)Server$/i.test(kind)) return kind;
	const inferred = inferKind(url);
	return inferred === "link" ? kind : inferred;
}
/** Guess a resource kind from its URL (SERVICE parameter, path, extension). */
function inferKind(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return "link";
	}
	for (const [key, value] of parsed.searchParams) if (key.toLowerCase() === "service" && value) return normalizeKind(value);
	const path = parsed.pathname.toLowerCase();
	if (path.endsWith(".xml") && path.includes("capabilities")) {
		if (path.includes("wmts")) return "WMTS";
		if (path.includes("wms")) return "WMS";
		if (path.includes("wfs")) return "WFS";
	}
	if (DOWNLOAD_EXTENSIONS.some((ext) => path.endsWith(ext))) return "download";
	if (parseArcgisUrl(url)) return ARCGIS_KIND;
	if (path.startsWith("/layers/")) return "link";
	if (path.includes("wmts")) return "WMTS";
	if (path.includes("wms")) return "WMS";
	if (path.includes("wfs")) return "WFS";
	if (path.includes("wcs")) return "WCS";
	return "link";
}
function normalizeKind(kind) {
	const raw = kind.trim();
	if (!raw) return "link";
	const up = raw.toUpperCase();
	if (up === "WMS" || up === "WFS" || up === "WCS" || up === "WMTS") return up;
	if (up === "DOWNLOAD") return "download";
	if (up === "LINK") return "link";
	return raw;
}
/**
* Usable resources of a search result, deduplicated by URL. Sources in order of
* reliability (as in openrndt): `resources_nst` (types assigned by the
* catalogue), `links` (declared dctype), then bare URLs in `webServices_s` and
* `links_s` with the kind inferred from the URL. Plain web links are dropped.
*/
function extractServices(result) {
	const source = asObject(result._source);
	const services = [];
	const seen = /* @__PURE__ */ new Set();
	const push = (kind, url) => {
		if (!/^https?:\/\//i.test(url) || seen.has(url) || kind === "link") return;
		seen.add(url);
		services.push({
			kind,
			url
		});
	};
	const nested = Array.isArray(source.resources_nst) ? source.resources_nst : [];
	for (const entry of nested) {
		const item = asObject(entry);
		const url = typeof item.url_s === "string" ? item.url_s : "";
		let kind = typeof item.url_type_s === "string" ? normalizeKind(item.url_type_s) : "link";
		if (kind === "link") kind = inferKind(url);
		push(arcgisKind(kind, url), url);
	}
	const links = Array.isArray(result.links) ? result.links : [];
	for (const entry of links) {
		const link = asObject(entry);
		const href = typeof link.href === "string" ? link.href : "";
		if (!href || NON_RESOURCE_RELS.has(String(link.rel))) continue;
		push(arcgisKind(typeof link.dctype === "string" ? normalizeKind(link.dctype) : inferKind(href), href), href);
	}
	for (const key of ["webServices_s", "links_s"]) for (const url of asStringList(source[key])) push(inferKind(url), url);
	return services;
}
/**
* The record's web links that are neither services nor recognised downloads,
* deduplicated. Bare home pages (no path, no query) are left out: they are the
* publisher's site, repeated in most records. MaGIC records keep their data in
* a GitHub folder this way (756 records link to github.com, 2026-09-27).
*/
function extractOtherLinks(result, services) {
	const source = asObject(result._source);
	const taken = new Set(services.map((s) => linkKey(s.url)));
	const links = [];
	const candidates = [...(Array.isArray(result.links) ? result.links : []).map(asObject).filter((link) => !NON_RESOURCE_RELS.has(String(link.rel))).map((link) => asString(link.href)), ...asStringList(source.links_s)];
	for (const url of candidates) {
		if (!/^https?:\/\//i.test(url) || inferKind(url) !== "link") continue;
		const parsed = new URL(url);
		if ((parsed.pathname === "/" || parsed.pathname === "") && !parsed.search) continue;
		const key = linkKey(url);
		if (taken.has(key)) continue;
		taken.add(key);
		links.push(url);
	}
	return links;
}
/** Same link whatever the scheme, case or trailing slash. */
function linkKey(url) {
	return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
}
function parseBbox(value) {
	const b = asObject(value);
	const box = [
		b.xmin,
		b.ymin,
		b.xmax,
		b.ymax
	].map(Number);
	return box.every((v) => Number.isFinite(v)) ? box : null;
}
function parseRecord(result, baseUrl) {
	const source = asObject(result._source);
	const id = asString(result.id) || asString(source.fileid);
	const itemUrl = `${baseUrl.replace(/\/+$/, "")}/rest/metadata/item/${encodeURIComponent(id)}`;
	const services = extractServices(result);
	return {
		id,
		title: asString(result.title) || asString(source.title) || id,
		abstract: asString(result.description) || asString(source.apiso_Abstract_txt),
		type: asString(source.apiso_Type_s),
		organisation: asString(source.EnteResponsabile_s),
		contactEmails: parseEmails(source.PuntoDiContattoEmail_s),
		modified: asString(source.apiso_Modified_dt).slice(0, 10),
		bbox: parseBbox(result.bbox),
		services,
		otherLinks: extractOtherLinks(result, services),
		htmlUrl: `${itemUrl}/html`,
		xmlUrl: `${itemUrl}/xml`
	};
}
function parseSearchResponse(payload, baseUrl) {
	const data = asObject(payload);
	const results = Array.isArray(data.results) ? data.results : [];
	return {
		total: Number(data.total) || 0,
		start: Number(data.start) || 1,
		records: results.map((r) => parseRecord(asObject(r), baseUrl))
	};
}
/** Footprints of the records as a GeoJSON FeatureCollection (one polygon each). */
function footprints(records) {
	const features = [];
	for (const record of records) {
		if (!record.bbox) continue;
		const [w, s, e, n] = record.bbox;
		features.push({
			type: "Feature",
			id: features.length,
			properties: {
				id: record.id,
				title: record.title,
				type: record.type,
				organisation: record.organisation
			},
			geometry: {
				type: "Polygon",
				coordinates: [[
					[w, s],
					[e, s],
					[e, n],
					[w, n],
					[w, s]
				]]
			}
		});
	}
	return {
		type: "FeatureCollection",
		features
	};
}
//#endregion
//#region src/rndt/settings.ts
/**
* Plugin settings and the log of failing service URLs. Both live in the
* webview's localStorage: per user and per computer, never in the project.
* Every access is guarded, so the panel works the same without storage.
*/
var SETTINGS_KEY = `${PLUGIN_ID}:settings`;
var ERROR_LOG_KEY = `${PLUGIN_ID}:error-log`;
function storage() {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}
function readJson(key) {
	try {
		const text = storage()?.getItem(key);
		return text ? JSON.parse(text) : null;
	} catch {
		return null;
	}
}
function writeJson(key, value) {
	try {
		storage()?.setItem(key, JSON.stringify(value));
	} catch {}
}
function loadSettings() {
	const stored = readJson(SETTINGS_KEY);
	return {
		logErrors: stored?.logErrors === true,
		rememberSearches: stored?.rememberSearches !== false
	};
}
function saveSettings(settings) {
	writeJson(SETTINGS_KEY, settings);
}
function readErrorLog() {
	const stored = readJson(ERROR_LOG_KEY);
	return Array.isArray(stored) ? stored : [];
}
/** Add an entry, dropping the oldest past ERROR_LOG_LIMIT; returns the new size. */
function appendErrorLog(entry) {
	const log = [...readErrorLog(), entry].slice(-1e3);
	writeJson(ERROR_LOG_KEY, log);
	return log.length;
}
function clearErrorLog() {
	try {
		storage()?.removeItem(ERROR_LOG_KEY);
	} catch {}
}
/** One JSON object per line, oldest first. */
function errorLogJsonl(log) {
	return log.map((entry) => JSON.stringify(entry)).join("\n") + (log.length ? "\n" : "");
}
//#endregion
//#region src/rndt/layer-names.ts
/**
* Readable names for WMS/WFS layers whose capabilities give only codes (#7).
*
* Survey of 64 services (2026-09-27): 88% of WMS layer titles are readable,
* but only 50% of WFS ones; 34% of WFS titles are words joined by `_` or
* CamelCase (`Parchi_naturali`), 16% opaque codes (`TDLD8`). The layer name
* always stays visible as the service gives it; a readable name comes from the
* capabilities title when it is one, or from RNDT records that link to the same
* service with the layer name in the link (`typeName`, `LAYERS`); FVG and
* Veneto publish one record per layer.
*/
/**
* Budget for the RNDT lookup: 0.15-0.6 s usually, 3.6 s at most measured, but
* the bulk download of a large service (2.5 MB for Emilia-Romagna) failed at
* the 8 s native budget on 2026-09-27. The lookup runs in the background and
* never blocks the layer menu, so it can wait longer.
*/
var LOOKUP_TIMEOUT_MS = 3e4;
/**
* Up to this many records the lookup downloads them all in one request
* (Veneto, 668 records: 1.2 MB, about 1 s); above it, it looks up only the
* layer the user selects. The largest service in the survey had 909.
*/
var BULK_LOOKUP_MAX = 1e3;
function localName(name) {
	return name.split(":").pop() ?? name;
}
/** True when the capabilities title reads as a name, not as a code. */
function isReadableTitle(name, title) {
	const t = title.trim();
	if (!t) return false;
	const lower = t.toLowerCase();
	if (lower === name.toLowerCase() || lower === localName(name).toLowerCase()) return false;
	if (/\s/.test(t)) return true;
	return /^[\p{L}'’-]{3,}$/u.test(t);
}
/**
* True when the title holds U+FFFD: a letter was lost on the server, not in
* decoding. Veneto's GeoServer (2026-10-01) serves 24 such titles, "Rover�
* Veronese", and RNDT has the whole one for 11 of them.
*/
function isDamagedTitle(title) {
	return title.includes("�");
}
/**
* Whether an RNDT title should replace the current one: always when there is
* none, and over a damaged title only when it reads as a name and is whole
* (for Roverè RNDT has only the code `c11023040561_RovereVer`).
*/
function improvesTitle(name, current, candidate) {
	if (!current) return true;
	return isDamagedTitle(current) && isReadableTitle(name, candidate) && !isDamagedTitle(candidate);
}
/** The capabilities title when it reads as a name, else null. */
function readableTitle(name, title) {
	return isReadableTitle(name, title) ? title.trim() : null;
}
/**
* Key that matches every link to the same service: host and path without the
* last segment (`…/geoserver/RIFIUTI/wfs` → `…/geoserver/RIFIUTI`), so WMS,
* WFS and OWS links of one workspace all count.
*/
function serviceKey(serviceUrl) {
	const url = new URL(serviceUrl);
	const path = url.pathname.replace(/\/+$/, "");
	const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : path;
	return `${url.host}${parent}`;
}
/** Lucene clause for the records that link to the service. */
function serviceClause(serviceUrl) {
	return `links_s:*${escapeTerm(serviceKey(serviceUrl))}*`;
}
/** RNDT search for records linking to the service, in the light CSW format. */
function layerTitlesUrl(baseUrl, serviceUrl, num = BULK_LOOKUP_MAX, layerName) {
	const q = layerName ? `${serviceClause(serviceUrl).slice(0, -1)}*${escapeTerm(localName(layerName))}*` : serviceClause(serviceUrl);
	const params = new URLSearchParams({
		q,
		start: "1",
		num: String(num),
		f: "csw"
	});
	return `${baseUrl.replace(/\/+$/, "")}/rest/metadata/search?${params.toString()}`;
}
/**
* RNDT search for the records linking to the service that mention the layer
* name anywhere in their metadata. Emilia-Romagna names the layer only in the
* `gmd:name` of the online resource, which the CSW format leaves out, and
* links a bare GetCapabilities: on 2026-09-30 this found 28 of the 43 layers
* of `wms/metadati_raster`, the link rules none.
*/
function layerCodeUrl(baseUrl, serviceUrl, layerName) {
	const q = `${serviceClause(serviceUrl)} AND ${escapeTerm(localName(layerName))}`;
	const params = new URLSearchParams({
		q,
		start: "1",
		num: "1",
		f: "csw"
	});
	return `${baseUrl.replace(/\/+$/, "")}/rest/metadata/search?${params.toString()}`;
}
function childText(el, local) {
	return (Array.from(el.getElementsByTagName("*")).find((c) => c.localName === local)?.textContent ?? "").trim();
}
var TRAILING_CODE = /\(([\p{L}\p{N}_.-]+)\)\s*$/u;
/**
* Layer titles from a CSW search response. Keys are lower-cased, both the full
* name (`rifiuti:tdld8`) and the local one (`tdld8`); the first record wins.
* Some records (FVG service records) link only to GetCapabilities but end their
* title with the layer code in brackets: those go in `codes`.
*/
function parseLayerTitles(xml) {
	const doc = parseXml(xml);
	const titles = /* @__PURE__ */ new Map();
	const codes = /* @__PURE__ */ new Map();
	const results = Array.from(doc.getElementsByTagName("*")).find((e) => e.localName === "SearchResults");
	const total = Number(results?.getAttribute("numberOfRecordsMatched")) || 0;
	for (const record of Array.from(doc.getElementsByTagName("*")).filter((e) => e.localName === "Record")) {
		const title = childText(record, "title");
		if (!title) continue;
		const code = TRAILING_CODE.exec(title)?.[1]?.toLowerCase();
		if (code && !codes.has(code)) codes.set(code, title);
		for (const ref of Array.from(record.getElementsByTagName("*")).filter((e) => e.localName === "references")) {
			const name = preselectedName((ref.textContent ?? "").trim());
			if (!name) continue;
			for (const key of [name.toLowerCase(), localName(name).toLowerCase()]) if (!titles.has(key)) titles.set(key, title);
		}
	}
	return {
		total,
		titles,
		codes
	};
}
/** Title for a layer: a link naming it first, then a matching code in a title. */
function findTitle(found, name) {
	const full = name.toLowerCase();
	const local = localName(name).toLowerCase();
	return found.titles.get(full) ?? found.titles.get(local) ?? found.codes.get(local) ?? null;
}
function merge(into, parsed) {
	for (const [k, v] of parsed.titles) if (!into.titles.has(k)) into.titles.set(k, v);
	for (const [k, v] of parsed.codes) if (!into.codes.has(k)) into.codes.set(k, v);
}
/**
* Titles from RNDT records that link to the service. First a count (about
* 0.2 s): no records, nothing else to do; up to BULK_LOOKUP_MAX, all of them
* in one request; above, `per-layer`. Never throws: on error or timeout it
* returns what it has (possibly nothing), so opening a service never depends
* on this lookup.
*/
async function lookupLayerTitles(host, baseUrl, serviceUrl, timeoutMs = LOOKUP_TIMEOUT_MS) {
	const found = {
		titles: /* @__PURE__ */ new Map(),
		codes: /* @__PURE__ */ new Map()
	};
	let perLayer = false;
	const work = async () => {
		const { total } = parseLayerTitles(await fetchText(host, layerTitlesUrl(baseUrl, serviceUrl, 0)));
		if (total === 0) return;
		if (total > 1e3) {
			perLayer = true;
			return;
		}
		merge(found, parseLayerTitles(await fetchText(host, layerTitlesUrl(baseUrl, serviceUrl), { download: true })));
	};
	try {
		await withTimeout(work(), timeoutMs);
	} catch {}
	return perLayer ? { mode: "per-layer" } : {
		mode: "all",
		found
	};
}
/** Title for one layer, for services with too many records to download (0.15-0.2 s). */
async function lookupOneLayerTitle(host, baseUrl, serviceUrl, layerName, timeoutMs = LOOKUP_TIMEOUT_MS) {
	try {
		return findTitle(parseLayerTitles(await withTimeout(fetchText(host, layerTitlesUrl(baseUrl, serviceUrl, 20, layerName)), timeoutMs)), layerName);
	} catch {
		return null;
	}
}
/** Title of the best-ranked record that mentions the layer name (0.2 s); null if none or on error. */
async function lookupLayerTitleByCode(host, baseUrl, serviceUrl, layerName, timeoutMs = LOOKUP_TIMEOUT_MS) {
	try {
		const doc = parseXml(await withTimeout(fetchText(host, layerCodeUrl(baseUrl, serviceUrl, layerName)), timeoutMs));
		const record = Array.from(doc.getElementsByTagName("*")).find((e) => e.localName === "Record");
		return record && childText(record, "title") || null;
	} catch {
		return null;
	}
}
//#endregion
//#region src/rndt/panel.ts
/** Minimal DOM builder: `on*` props become listeners, the rest are properties or attributes. */
function h(tag, props = {}, ...children) {
	const el = document.createElement(tag);
	for (const [key, value] of Object.entries(props)) {
		if (value === void 0 || value === null || value === false) continue;
		if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
		else if (key === "className" || key === "textContent" || key === "value" || key === "checked" || key === "disabled" || key === "selected") {
			el[key] = value;
			if (key === "checked") el.defaultChecked = value === true;
			if (key === "selected") el.defaultSelected = value === true;
		} else el.setAttribute(key, value === true ? "" : String(value));
	}
	for (const child of children) {
		if (child === null || child === void 0 || child === false) continue;
		el.append(child);
	}
	return el;
}
function select(options, value, props = {}) {
	return h("select", {
		className: "ordt-input",
		...props
	}, ...options.map((o) => h("option", {
		value: o.value,
		selected: o.value === value
	}, o.label)));
}
function radioGroup(name, options, value, onChange, className = "ordt-radios") {
	return h("div", {
		className,
		role: "radiogroup"
	}, ...options.map((o) => h("label", { className: "ordt-radio" }, h("input", {
		type: "radio",
		name,
		value: o.value,
		checked: o.value === value,
		onchange: onChange
	}), o.label)));
}
function checkedValue(root, name) {
	return root.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
}
/** Show a question with one button per choice inside `container`; resolves with the chosen value. */
function askChoice(container, message, choices) {
	return new Promise((resolve) => {
		container.dataset.kind = "info";
		container.replaceChildren(message, h("span", { className: "ordt-row ordt-choices" }, ...choices.map((c) => h("button", {
			className: "ordt-button",
			type: "button",
			onclick: () => resolve(c.value)
		}, c.label))));
	});
}
function host(url) {
	try {
		return new URL(url).host;
	} catch {
		return url;
	}
}
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function isFeatureCollection(value) {
	if (!value || typeof value !== "object") return false;
	const v = value;
	return v.type === "FeatureCollection" && Array.isArray(v.features);
}
function isGeoJsonUrl(url) {
	return /\.(geo)?json(\?|#|$)/i.test(url) || /[?&](f|format|outputformat)=[^&]*json/i.test(url);
}
/** One key for every link to the same ArcGIS REST service, scheme and case aside. */
function arcgisKey(url) {
	const parsed = parseArcgisUrl(url);
	return parsed ? parsed.serviceUrl.replace(/^https?:\/\//i, "").toLowerCase() : null;
}
/**
* The record's services plus, for each ArcGIS WMTS, the WMS and the ArcGIS
* REST service of the same service (GeoLibre plugins cannot add a WMTS; both
* reproject on request). Each is added only when the record does not
* already declare it.
*/
function servicesWithDerivedWms(services) {
	const groups = groupServices(services);
	const key = (url) => serviceBaseUrl(url).replace(/^https?:\/\//i, "").toLowerCase();
	const declared = new Set(groups.filter((g) => g.kind === "WMS").map((g) => key(g.url)));
	const declaredRest = new Set(groups.filter((g) => g.kind === ARCGIS_KIND).map((g) => arcgisKey(g.url)));
	const derived = [];
	for (const group of groups) {
		if (group.kind !== "WMTS") continue;
		const wms = arcgisWmsFromWmts(group.url);
		if (wms && !declared.has(key(wms))) {
			declared.add(key(wms));
			derived.push({
				kind: "WMS",
				url: wms,
				layerHint: null,
				derivedFrom: group.url
			});
		}
		const rest = arcgisRestFromWmts(group.url);
		if (rest && !declaredRest.has(arcgisKey(rest))) {
			declaredRest.add(arcgisKey(rest));
			derived.push({
				kind: ARCGIS_KIND,
				url: rest,
				layerHint: null,
				derivedFrom: group.url
			});
		}
	}
	return [...groups, ...derived];
}
/**
* Records often list the same WMS/WFS twice (a GetCapabilities link and a
* GetMap/GetFeature link naming the layer). Merge them by endpoint and keep the
* layer name as a hint for preselection.
*/
function groupServices(services) {
	const groups = /* @__PURE__ */ new Map();
	for (const service of services) {
		let key = service.url;
		let hint = preselectedName(service.url);
		const arcgis = service.kind === "ArcGIS REST" ? parseArcgisUrl(service.url) : null;
		if (arcgis) {
			key = `${ARCGIS_KIND} ${arcgisKey(service.url)}`;
			hint = arcgis.layerId;
		} else if ([
			"WMS",
			"WFS",
			"WCS",
			"WMTS"
		].includes(service.kind)) try {
			const base = serviceBaseUrl(service.url).replace(/^https?:\/\//i, "").toLowerCase();
			key = `${service.kind} ${base.replace(/\/(?:ows|wms|wfs|wcs|wmts)(?=$|\?)/, "/ows")}`;
		} catch {}
		const existing = groups.get(key);
		if (existing) {
			existing.layerHint ??= hint;
			if (/^http:/i.test(existing.url) && /^https:/i.test(service.url)) existing.url = service.url;
		} else groups.set(key, {
			...service,
			url: arcgis ? arcgis.serviceUrl : service.url,
			layerHint: hint
		});
	}
	return Array.from(groups.values());
}
/** "3 layers", "1 layer". */
function layerCount(n) {
	return `${n.toLocaleString("en")} ${n === 1 ? "layer" : "layers"}`;
}
/** Scroll a layer list to its first ticked row: the preselected layer may be far down. */
function showTicked(list) {
	const row = list.querySelector("input:checked")?.closest(".ordt-layer");
	if (row) list.scrollTop = row.offsetTop - 4;
}
/**
* The layer to tick when the list opens: the one the record's link names, else,
* for a dataset record, the layer closest to its title. A service record
* describes the whole service: nothing is picked for the user.
*/
function wantedLayer(record, service, layers) {
	if (service.layerHint) return service.layerHint;
	return record.type === "service" ? null : bestMatchingLayer(record.title, layers);
}
/** Layers that can be ticked. */
function enabledCount(layers, disabledReason) {
	return layers.filter((l) => !disabledReason(l.name)).length;
}
/** Where the plugin lives: code, releases, issues. */
var PLUGIN_REPO_URL = "https://github.com/ondata/openrndt-geolibre";
/** GitHub mark, from Primer Octicons (mark-github-16, MIT). */
var GITHUB_MARK = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 16 16\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656\"/></svg>";
/** The plugin repo as a GitHub icon (the panel header takes plain text only). */
function repoLink() {
	const link = h("a", {
		className: "ordt-link ordt-repo",
		href: PLUGIN_REPO_URL,
		target: "_blank",
		rel: "noopener",
		title: "The plugin on GitHub: code, releases, issues",
		"aria-label": "The plugin on GitHub"
	});
	link.innerHTML = GITHUB_MARK;
	return link;
}
/** RNDT contact, from the footer of geodati.gov.it (AgID). */
var RNDT_EMAIL = "info@rndt.gov.it";
/**
* An email to who publishes a record, for any request: it names the record and
* leaves a place for the request. It goes to the record's point of contact,
* with no copy to RNDT, which a question on a licence or an update does not
* concern. With no address in the record it goes to RNDT and asks whom to
* write to. In Italian, the language of the catalogue.
*/
function contactEmail(record) {
	const what = record.type === "service" ? "servizio" : "dataset";
	const about = [
		`Scheda: ${record.title}`,
		`Identificativo: ${record.id}`,
		`Pagina della scheda: ${record.htmlUrl}`,
		...record.organisation ? [`Ente: ${record.organisation}`] : []
	];
	if (record.contactEmails.length > 0) return {
		to: record.contactEmails,
		cc: [],
		subject: `Richiesta sul ${what} ${record.title}`,
		body: [
			"Buongiorno,",
			"",
			`vi scrivo come referenti di un ${what} indicato nel Repertorio Nazionale dei Dati Territoriali (RNDT), che ho trovato con GeoLibre (plugin openrndt-geolibre).`,
			"",
			...about,
			"",
			"[Scrivi qui la tua richiesta: un chiarimento sul dato, la licenza, un aggiornamento, un formato]",
			"",
			"Grazie e buon lavoro"
		].join("\n")
	};
	return {
		to: [RNDT_EMAIL],
		cc: [],
		subject: `Contatto per il ${what} ${record.title}`,
		body: [
			"Buongiorno,",
			"",
			`vi ringrazio per il catalogo RNDT. Vorrei scrivere all'ente responsabile di questa scheda, che non indica un indirizzo email del punto di contatto.${record.organisation ? "" : " La scheda non indica nemmeno l'ente responsabile."} Potete indicarmi a chi rivolgermi?`,
			"",
			...about,
			"",
			"Grazie e buon lavoro"
		].join("\n")
	};
}
/**
* A report on a service that failed to load, with what is needed to check it:
* record, service, error, time (UTC). It is addressed to the record's point of
* contact, who runs the service, with RNDT in copy; to RNDT alone when the
* record names no contact. In Italian, the language of the catalogue.
*/
function errorReport(record, service, error, now = /* @__PURE__ */ new Date()) {
	const toContact = record.contactEmails.length > 0;
	const app = isDesktop() ? "GeoLibre Desktop" : "GeoLibre";
	const intro = toContact ? `vi scrivo come referenti del servizio ${service.kind} indicato in una scheda del Repertorio Nazionale dei Dati Territoriali (RNDT). Ho provato ad aggiungerlo a una mappa (${app}, plugin openrndt-geolibre), ma il caricamento ha dato errore. Metto in copia il RNDT.` : `vi ringrazio per il catalogo RNDT. Ho provato ad aggiungere a una mappa un servizio ${service.kind} indicato in una scheda del catalogo (${app}, plugin openrndt-geolibre), ma il caricamento ha dato errore.`;
	return {
		to: toContact ? record.contactEmails : [RNDT_EMAIL],
		cc: toContact ? [RNDT_EMAIL] : [],
		subject: `Errore nel caricamento del servizio ${service.kind} - ${record.title}`,
		body: [
			"Buongiorno,",
			"",
			intro,
			"",
			`Scheda: ${record.title}`,
			`Identificativo: ${record.id}`,
			`Pagina della scheda: ${record.htmlUrl}`,
			...record.organisation ? [`Ente: ${record.organisation}`] : [],
			`Servizio: ${service.url}`,
			`Errore: ${error}`,
			`Data e ora (UTC): ${now.toISOString().slice(0, 16).replace("T", " ")}`,
			"",
			"Vi segnalo il problema nel caso sia utile per verificare il servizio o la scheda.",
			"",
			"Grazie e buon lavoro"
		].join("\n")
	};
}
/** An email as text to paste into a new one: recipients and subject first. */
function emailText(report) {
	return [
		`A: ${report.to.join(", ")}`,
		...report.cc.length ? [`Cc: ${report.cc.join(", ")}`] : [],
		`Oggetto: ${report.subject}`,
		"",
		report.body
	].join("\n");
}
/** Layers above which the layer menu gets a filter field (Veneto WFS: 1,068). */
var FILTER_THRESHOLD = 30;
/**
* Above this many layers the list opens folded: only the ticked rows and a
* "Show all" button, so the next service of the record stays in sight (a WFS
* with 1,068 feature types pushed the WMS below the fold, 2026-10-02).
*/
var FOLD_THRESHOLD = 8;
/** Group layers of one WMS that get a test tile: each is a request, and the list waits for them. */
var MAX_GROUP_TESTS = 10;
var LINK_KINDS = [
	"WMS",
	"WFS",
	"ArcGIS REST"
];
var KIND_OPTIONS = [
	{
		value: "all",
		label: "All"
	},
	{
		value: "data",
		label: "Data"
	},
	{
		value: "services",
		label: "Services"
	}
];
var TEXT_MODES = [
	{
		value: "all",
		label: "All words"
	},
	{
		value: "any",
		label: "Any word"
	},
	{
		value: "lucene",
		label: "Lucene"
	}
];
var SEARCH_EXAMPLES = [
	{
		mode: "all",
		text: "catastale comune misiliscemi",
		note: "every word must appear"
	},
	{
		mode: "any",
		text: "idrografia fiumi",
		note: "one word is enough: more results"
	},
	{
		mode: "lucene",
		text: "\"comune di misiliscemi\"",
		note: "exact phrase"
	},
	{
		mode: "lucene",
		text: "catastale AND NOT comune",
		note: "exclude a word"
	},
	{
		mode: "lucene",
		text: "catastale AND NOT EnteResponsabile_s:\"Agenzia delle Entrate\"",
		note: "leave out an organisation (from about 8,100 records to about 440); the name must be exact, case included"
	},
	{
		mode: "all",
		text: "misilis*",
		note: "* truncates a word, in every mode"
	}
];
/** One entry per "Search in" option, same order as SEARCH_FIELDS. */
var FIELD_EXAMPLES = [
	{
		mode: "all",
		text: "ortofoto",
		field: "",
		note: "the whole record"
	},
	{
		mode: "all",
		text: "ortofoto",
		field: "title",
		note: "the title only"
	},
	{
		mode: "all",
		text: "ortofoto",
		field: "description",
		note: "the abstract, the description of the resource"
	},
	{
		mode: "all",
		text: "ortofoto",
		field: "apiso_Lineage_txt",
		note: "how the data were produced: sources, methods, processing"
	},
	{
		mode: "all",
		text: "*CC*",
		field: "apiso_AccessConstraints_s",
		note: "conditions of use and access, e.g. the licence. The statement is stored as one exact, case-sensitive value: a plain word matches only if it is the whole statement, so surround words with *"
	}
];
/** One entry per "Where" option, same order as WHERE_OPTIONS (defined below). */
var WHERE_HELP = [
	{
		value: "anywhere",
		note: "no area filter, the whole catalogue"
	},
	{
		value: "view",
		note: "the part of the map visible when you press Search; moving the map afterwards does not search again"
	},
	{
		value: "drawn",
		note: "the rectangle around all the shapes drawn with GeoEditor, not their exact outline; a single point becomes a square of about 100 m. Choosing it turns GeoEditor on"
	},
	{
		value: "box",
		note: "four numbers in degrees (WGS84): west, south, east, north. Example, the province of Palermo:",
		box: "12.95, 37.60, 14.30, 38.30"
	}
];
/** A "?" button that shows and hides `box`, an inline help panel. */
/** Shortcuts under the date range: days back from today. */
var DATE_PRESETS = [
	["Last week", 7],
	["Last month", 30],
	["Last year", 365]
];
/** yyyy-mm-dd in local time (`toISOString` would give the UTC day). */
function localIsoDate(date) {
	const pad = (n) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function helpToggle(box, label) {
	const button = h("button", {
		className: "ordt-help-toggle",
		type: "button",
		"aria-expanded": "false",
		"aria-controls": box.id,
		"aria-label": label,
		title: label,
		onclick: () => {
			box.hidden = !box.hidden;
			button.setAttribute("aria-expanded", String(!box.hidden));
		}
	}, "?");
	return button;
}
/** An inline help panel, hidden until its "?" is pressed. */
function helpBox(id, ...children) {
	return h("div", {
		className: "ordt-help",
		id,
		hidden: true
	}, ...children);
}
/**
* A ⋯ button with its menu; picking an item closes the menu. The menu opens
* under the button, or above it when it would end under the footer or the edge
* of the window and there is room above (the ⋯ of the detail view is often the
* last row of the panel).
*/
function menuWrap(menu, label) {
	const button = h("button", {
		className: "ordt-button ordt-menu-button",
		type: "button",
		"aria-label": label,
		title: label,
		"aria-haspopup": "menu",
		onclick: () => {
			menu.hidden = !menu.hidden;
			menu.classList.remove("ordt-menu-up");
			if (menu.hidden) return;
			const footer = button.closest(".ordt-panel")?.querySelector(".ordt-footer")?.getBoundingClientRect();
			const floor = Math.min(window.innerHeight, footer && footer.top > 0 ? footer.top : Infinity);
			const box = menu.getBoundingClientRect();
			if (box.bottom > floor && button.getBoundingClientRect().top - box.height > 0) menu.classList.add("ordt-menu-up");
		}
	}, "⋯");
	menu.addEventListener("click", (event) => {
		const item = event.target.closest("button");
		if (item && !item.hasAttribute("data-keep-open")) menu.hidden = true;
	});
	return h("span", { className: "ordt-menu-wrap" }, button, menu);
}
/**
* A button that copies an email to the clipboard, with its recipients written
* beside it: the desktop app opens no mailto: link. One shape for the error
* report of a service and for the email to the organisation of a record.
*/
function copyEmailControl(label, email, to, className, title) {
	const button = h("button", {
		className: `ordt-button ${className}`,
		type: "button",
		title
	}, label);
	button.addEventListener("click", () => {
		navigator.clipboard?.writeText(emailText(email)).then(() => {
			button.textContent = "Copied: paste it into a new email";
			setTimeout(() => button.textContent = label, 3e3);
		}, () => void 0);
	});
	return h("span", { className: "ordt-report-wrap" }, button, " ", h("span", { className: "ordt-muted" }, `(to ${to})`));
}
/** "Copy error report", under the error of a service that failed to load. */
function reportControl(record, service, error) {
	const report = errorReport(record, service, error);
	return copyEmailControl("Copy error report", report, report.cc.length ? `${report.to.join(", ")}, RNDT in copy` : report.to.join(", "), "ordt-report", "Copy recipients, subject and text of an email about this error");
}
/** A titled part of "Search help": the panel inside is always shown there. */
function helpSection(title, box) {
	box.hidden = false;
	return h("section", { className: "ordt-help-section" }, h("h3", {}, title), box);
}
/** A help panel made of plain paragraphs. */
function textHelp(id, paragraphs) {
	return helpBox(id, ...paragraphs.map((text) => h("p", {}, text)));
}
/** A "Label: explanation" list item, as in the "Where" help. */
function termItem(term, note) {
	return h("li", {}, h("strong", {}, term), `: ${note}`);
}
var RESOURCES_HELP = [
	["All", "data and services"],
	["Data", "records describing datasets and dataset series, about 20,700"],
	["Services", "records describing a web service (WMS, WFS, ATOM and others), about 3,200; a menu lets you pick the service type. INSPIRE theme and Open data only do not apply to services"]
];
var RESOURCES_NOTE = "This is the type of the record, not what you can do with it: a dataset record often links to a WMS or WFS too. The cadastral maps are about 7,700 dataset records, each with a WMS and a WFS, while the national cadastral service is a single service record. To find what you can add to the map, use Available as.";
var AVAILABLE_AS_HELP = ["Keeps the records that link to a WMS, a WFS or an ArcGIS REST service, the services this plugin can add to the map, whatever the record type. With more boxes ticked, one of them is enough: idrografia finds about 1,130 records, 590 of them with a WMS or WFS.", "The check looks for wms or wfs in the link address, so it matches the WMS and WFS badges of the results in about 99 cases out of 100. ArcGIS REST looks for a MapServer, ImageServer or FeatureServer under rest/services: about 1,600 records, about 650 of them with no WMS or WFS (Arpae Emilia-Romagna, Regione Lombardia, Arpa Piemonte)."];
var THEME_HELP = ["One of the 34 INSPIRE themes, as declared by the publisher. Almost every dataset has one; services have none, so with Services this filter is ignored."];
var KEYWORDS_HELP = ["Keywords as the publisher wrote them. The match is exact and case-sensitive: opendata finds thousands of records, OpenData only a few.", "Separate several keywords with commas: a record needs just one of them."];
var ORGANISATION_HELP = [
	"The owner of the resource, with its name as in the IPA index of public administrations, not the metadata contact. Part of the name is enough and case does not matter: piemonte finds Regione Piemonte.",
	"Data are listed under whoever published them: data commissioned by a municipality but published by its Region appear under the Region.",
	"Separate several organisations with commas. Hide these hides them instead: entrate hides Agenzia delle Entrate, which alone publishes about a third of the catalogue (its municipal cadastral maps).",
	"In the results, the ⋯ menu of a record keeps only its organisation or hides it."
];
var OPEN_DATA_HELP = ["Records whose publisher filled in the open data field. It is a declaration, not a check: the field may hold a licence (CC BY 4.0), just the words open data, or even a non-commercial licence.", "Records that state an open licence only in another field are left out. Ignored with Services."];
var DATE_HELP = [
	["Revision", "the last update of the resource"],
	["Publication", "when the resource was published"],
	["Creation", "when the resource was produced"],
	["Added to catalogue", "when the record entered the RNDT catalogue, not a date of the resource. Every record has it, but 23,342 records carry 25 April 2026, when the catalogue was loaded in bulk: it tells new records only after that day"]
];
/**
* "Relevance" without any text is the order the catalogue indexed the records
* in (measured 2026-10-02: `updated` grows by milliseconds page after page),
* so the newest metadata come first instead. The form keeps "Relevance": as
* soon as a text is typed, the catalogue weighs it.
*/
function withEffectiveSort(form) {
	return form.sort === "" && form.text.trim() === "" ? {
		...form,
		sort: "apiso_Modified_dt:desc"
	} : form;
}
var SORT_HELP = [
	["Relevance", "the records that best match the words searched come first. Without any text the catalogue has nothing to weigh and gives the records in the order it indexed them, so the newest metadata come first instead"],
	["Title", "alphabetical order"],
	["Metadata date", "when the record was last updated in the catalogue. It is not one of the dates of the Date filter"]
];
var SORT_NOTE = "The catalogue cannot sort by the resource dates (revision, publication, creation): it ignores that request.";
/** The search bar's text box and button join the form through this id. */
var FORM_ID = "ordt-search-form";
var WHERE_OPTIONS = [
	{
		value: "anywhere",
		label: "Anywhere"
	},
	{
		value: "view",
		label: "Current map view"
	},
	{
		value: "drawn",
		label: "Drawn shapes (GeoEditor)"
	},
	{
		value: "box",
		label: "Box (west, south, east, north)"
	}
];
var ORG_MODES = [{
	value: "only",
	label: "Show only these"
}, {
	value: "hide",
	label: "Hide these"
}];
var SPATIAL_RELS = [{
	value: "Intersects",
	label: "Touches the area"
}, {
	value: "Within",
	label: "Inside the area"
}];
/**
* The RNDT search panel. Renders into the container GeoLibre hands to
* `registerRightPanel`, owns the footprints layer and talks to the host API.
*/
var RndtPanel = class {
	app;
	root;
	formEl;
	statusEl;
	listEl;
	pagerEl;
	/** The same pager above the list (#12), so the next page needs no scrolling. */
	pagerTopEl;
	/** Text box and Search button, kept at the top while the panel scrolls. */
	searchBarEl;
	/** One line with the filters of the last search, shown while the form is folded. */
	summaryEl;
	filtersLinkEl;
	zoomLinkEl;
	emptyEl;
	detailBarEl;
	summaryToggleEl;
	chipsEl;
	clearAllEl;
	/** Number of active advanced filters, next to "Advanced filters". */
	advancedCountEl;
	/** "Search help": the help of the fields that have no "?" of their own. */
	helpEl;
	/** Pager, curl, sort and the ⋯ menu, kept below the search bar. */
	resultsHeadEl;
	resultActionsEl;
	sortEl;
	zoomRowEl;
	helpToggleEl;
	footerEl;
	/** "Settings": per-user options, stored on this computer only. */
	settingsEl;
	settingsToggleEl;
	logCountEl;
	settings = loadSettings();
	/** Recent searches, newest first (see `history.ts`). */
	history = loadHistory();
	historyEl;
	historyCountEl;
	/** The highlighted entry of the open list, or -1 for the search box. */
	historyHi = -1;
	historyConfirm = false;
	/** Whether the text in the box was typed since the list opened: only then it narrows the list. */
	historyTyped = false;
	/** Whether the first entry of the history is the search on screen. */
	tracksTop = false;
	/** Set before a submit that changes the search on screen (a chip removed) instead of starting one. */
	refining = false;
	/** The box of a search run again from the history or a project, and what its area was called. */
	savedArea = null;
	footprintsLayer = null;
	records = [];
	total = 0;
	start = 1;
	/** The record shown in the detail view, or null while the list is shown. */
	detailId = null;
	detailEl;
	requestSeq = 0;
	lastForm = null;
	/** Gives each layer list its own radio group name. */
	layerListSeq = 0;
	/** Layer rows of the open detail view, to tell apart layers that would get the same name. */
	detailRows = [];
	/** WMS layers added from this panel ("GetMap URL|layer" → GeoLibre layer id), to spot them in the project. */
	addedWms = /* @__PURE__ */ new Map();
	projectWmsCache = null;
	/** Watches the sticky bars' heights; stopped when the panel is destroyed. */
	stickyObserver = null;
	copyQueryEl;
	copyAgentLabelEl;
	shareLabelEl;
	copyAgentHintEl;
	footprintsToggleEl;
	/** A search asked by a link before the first mount. */
	pendingLink = null;
	/** A state given by a project before the first mount. */
	pendingState = null;
	/** The id the last search opened by itself (an id typed as text), or null. */
	lastId = null;
	constructor(app) {
		this.app = app;
	}
	/**
	* Render into the host container. GeoLibre calls `render` every time the
	* panel becomes active and empties the container on close, so the same DOM
	* (form, results) is reused: closing and reopening keeps the state.
	*/
	mount(container) {
		if (!this.root) {
			this.root = h("div", { className: "ordt-panel" });
			this.formEl = this.buildForm();
			this.searchBarEl = this.buildSearchBar();
			this.summaryEl = this.buildSummary();
			this.statusEl = h("div", {
				className: "ordt-status",
				role: "status",
				"aria-live": "polite"
			});
			this.listEl = h("ol", { className: "ordt-results" });
			this.pagerEl = h("div", { className: "ordt-pager" });
			this.pagerTopEl = h("div", { className: "ordt-pager ordt-pager-top" }, this.statusEl);
			this.resultsHeadEl = this.buildResultsHead();
			this.settingsEl = this.buildSettings();
			this.emptyEl = h("div", {
				className: "ordt-empty ordt-small",
				hidden: true
			});
			this.detailBarEl = h("div", {
				className: "ordt-detail-bar ordt-small",
				hidden: true
			});
			this.detailEl = h("section", {
				className: "ordt-detail-view",
				hidden: true,
				"aria-label": "Record details"
			});
			this.footerEl = this.buildFooter();
			this.root.append(this.searchBarEl, this.formEl, this.helpEl, this.settingsEl, this.summaryEl, this.resultsHeadEl, this.listEl, this.emptyEl, this.pagerEl, this.detailBarEl, this.detailEl, this.footerEl);
			this.root.addEventListener("click", (event) => {
				const link = event.target.closest?.("a[target=\"_blank\"]");
				if (!link || !this.app.openExternalUrl || !/^https?:/i.test(link.href)) return;
				event.preventDefault();
				this.app.openExternalUrl(link.href);
			});
			this.root.addEventListener("mousedown", (event) => {
				if (!event.composedPath().includes(this.searchBarEl)) this.showHistory(false);
			});
			this.root.addEventListener("click", (event) => {
				for (const menu of this.root.querySelectorAll(".ordt-menu:not([hidden])")) if (!menu.parentElement.contains(event.target)) menu.hidden = true;
			});
			this.trackStickyHeights();
			this.setStatus("Search the Italian national catalogue of spatial data (RNDT).");
		}
		container.append(this.root);
		const [link, state] = [this.pendingLink, this.pendingState];
		this.pendingLink = this.pendingState = null;
		if (link) this.searchFromLink(link);
		else if (state) this.restore(state);
		return () => this.root?.remove();
	}
	/**
	* Run the search a link asks for (`?rndt=`, `?rndtKind=`, … see
	* url-params.ts): now, or at the first mount when GeoLibre has not rendered
	* the panel yet. The link's form replaces the whole form, every field it
	* leaves out at its default and the area Anywhere without a box, so the same
	* link finds the same records for everyone.
	*/
	searchFromLink(link) {
		if (!this.root) {
			this.pendingLink = link;
			return;
		}
		this.writeForm(link.form);
		this.formEl.requestSubmit();
	}
	/** What a project saves of the panel: the last search, its page, the open record. Null before any search. */
	projectState() {
		if (!this.root || !this.lastForm) return this.pendingState;
		return {
			v: 1,
			form: this.lastId ? {
				...emptyForm(),
				text: this.lastId
			} : {
				...this.lastForm,
				sort: this.field("sort").value
			},
			start: this.start,
			recordId: this.detailId
		};
	}
	/**
	* Bring back a search saved in a project: now, or at the first mount.
	* GeoLibre gives the state again when the map is re-created (a basemap
	* swap): one equal to what the panel shows does nothing.
	*/
	restore(state) {
		if (!this.root) {
			this.pendingState = state;
			return;
		}
		if (JSON.stringify(state) === JSON.stringify(this.projectState())) return;
		this.writeForm(state.form);
		if (state.form.bbox) this.savedArea = {
			box: this.field("box").value.trim(),
			label: "Saved area"
		};
		this.search(state.start, void 0, state.recordId, "none");
	}
	/**
	* Back to an empty panel: a project that carries no search was opened, and
	* the search on screen belongs to the project before it. A form filled in
	* but never searched is left alone.
	*/
	reset() {
		this.pendingState = null;
		if (!this.root || !this.lastForm) return;
		this.formEl.reset();
		this.field("text").value = "";
		this.afterReset();
		this.clearResults();
		this.chipsEl.replaceChildren();
		this.lastId = null;
		this.setStatus("Search the Italian national catalogue of spatial data (RNDT).");
	}
	/** Put a search into the form's fields, the inverse of `readForm`. The area becomes a box, or Anywhere. */
	writeForm(form) {
		const setRadio = (name, value) => {
			const radio = this.formEl.querySelector(`input[name="${name}"][value="${value}"]`);
			if (radio) radio.checked = true;
		};
		const setChecks = (name, values) => {
			for (const box of this.formEl.querySelectorAll(`input[name="${name}"]`)) box.checked = values.includes(box.value);
		};
		this.field("text").value = form.text;
		setRadio("textMode", form.textMode);
		this.field("field").value = form.field;
		setRadio("kind", form.kind);
		this.formEl.querySelector(".ordt-service-types").hidden = form.kind !== "services";
		setChecks("availableAs", form.availableAs);
		setChecks("serviceType", form.serviceTypes);
		this.field("theme").value = form.inspireThemes[0] ?? "";
		this.field("keywords").value = form.keywords;
		this.field("organisation").value = form.organisation;
		this.setOrgMode(form.invertOrganisation ? "hide" : "only");
		this.field("openData").checked = form.openDataOnly;
		this.field("dateField").value = form.dateField;
		this.field("dateFrom").value = form.dateFrom;
		this.field("dateTo").value = form.dateTo;
		this.field("sort").value = form.sort;
		const where = this.field("where");
		where.value = form.bbox ? "box" : "anywhere";
		where.dispatchEvent(new Event("change"));
		this.field("box").value = form.bbox ? form.bbox.join(", ") : "";
		setRadio("spatialRel", form.spatialRel);
		this.syncClearButtons();
		this.updateAdvancedCount();
	}
	/** Remove the panel DOM and the footprints (plugin deactivation). */
	destroy() {
		this.requestSeq++;
		this.stickyObserver?.disconnect();
		this.stickyObserver = null;
		this.footprintsLayer?.remove();
		this.footprintsLayer = null;
		this.root?.remove();
		this.root = void 0;
	}
	/**
	* The footprints overlay, created on first use: at startup a project can
	* reactivate the plugin before the map exists.
	*/
	footprintsOverlay() {
		if (!this.footprintsLayer) {
			const map = this.app.getMap?.();
			if (map) this.footprintsLayer = new FootprintsLayer(map, (id) => this.openDetail(id), (id) => this.markHovered(id));
		}
		return this.footprintsLayer;
	}
	/**
	* Put an organisation in the Organisation filter and search again, keeping
	* the other filters. "More filters" opens so the active filter is visible.
	*/
	filterByOrganisation(name) {
		this.field("organisation").value = name;
		this.setOrgMode("only");
		this.syncClearButtons();
		this.formEl.querySelector(".ordt-more").open = true;
		this.formEl.requestSubmit();
	}
	/** "Show only these" or "Hide these" under Organisation. */
	setOrgMode(mode) {
		this.formEl.querySelector(`input[name="orgMode"][value="${mode}"]`).checked = true;
	}
	/** Hide an organisation (Organisation + Hide these) and search again. */
	excludeOrganisation(name) {
		const input = this.field("organisation");
		const names = checkedValue(this.formEl, "orgMode") === "hide" ? input.value.split(",").map((n) => n.trim()).filter(Boolean) : [];
		if (!names.some((n) => n.toLowerCase() === name.toLowerCase())) names.push(name);
		input.value = names.join(", ");
		this.setOrgMode("hide");
		this.syncClearButtons();
		this.formEl.querySelector(".ordt-more").open = true;
		this.formEl.requestSubmit();
	}
	/** Search in a help example's box, keeping the rest of the form. */
	runBoxExample(box) {
		const where = this.formEl.querySelector("select[name=\"where\"]");
		where.value = "box";
		where.dispatchEvent(new Event("change"));
		this.formEl.querySelector("input[name=\"box\"]").value = box;
		this.formEl.requestSubmit();
	}
	/** Fill text, mode and "Search in" from a help example, then search. */
	runExample(example) {
		this.field("text").value = example.text;
		this.formEl.querySelector(`input[name="textMode"][value="${example.mode}"]`).checked = true;
		this.formEl.querySelector("select[name=\"field\"]").value = example.field ?? "";
		this.formEl.requestSubmit();
	}
	buildForm() {
		const serviceTypes = h("fieldset", {
			className: "ordt-fieldset ordt-service-types",
			hidden: true
		}, h("legend", {}, "Service type"), ...SERVICE_TYPES$1.map((o) => h("label", { className: "ordt-check" }, h("input", {
			type: "checkbox",
			name: "serviceType",
			value: o.value
		}), o.label)));
		const toggleServiceTypes = () => {
			serviceTypes.hidden = checkedValue(this.formEl, "kind") !== "services";
		};
		const boxInput = h("input", {
			className: "ordt-input",
			name: "box",
			placeholder: "12.3, 41.7, 12.7, 42.0",
			hidden: true,
			"aria-label": "Box as west, south, east, north"
		});
		const spatialRel = radioGroup("spatialRel", SPATIAL_RELS, "Intersects", () => void 0);
		spatialRel.classList.add("ordt-spatial-rel", "ordt-small");
		spatialRel.setAttribute("aria-label", "Records whose extent");
		const whereSelect = select(WHERE_OPTIONS, "view", {
			name: "where",
			"aria-label": "Where",
			onchange: () => {
				boxInput.hidden = whereSelect.value !== "box";
				spatialRel.hidden = whereSelect.value === "anywhere";
				if (whereSelect.value === "drawn") this.prepareDrawing();
			}
		});
		const themes = select([{
			value: "",
			label: "Any theme"
		}, ...INSPIRE_THEMES], "", {
			name: "theme",
			"aria-label": "INSPIRE theme"
		});
		const exampleButton = (example) => h("button", {
			className: "ordt-link ordt-example",
			type: "button",
			onclick: () => this.runExample(example)
		}, example.text);
		const modeHelp = h("div", {
			className: "ordt-help",
			id: "ordt-search-help",
			hidden: true
		}, h("p", {}, "Click an example to try it."), h("ul", {}, ...SEARCH_EXAMPLES.map((example) => h("li", {}, exampleButton(example), ` ${TEXT_MODES.find((o) => o.value === example.mode).label}: ${example.note}`))), h("p", {}, "Lucene sends the text as it is, so characters such as / : ( ) \" are query syntax: 42/2004 works in All words but is an error in Lucene."), h("p", {}, "A record id alone, as \"Copy id\" gives it (r_veneto:c11023040561_RovereVer), opens that record whatever the filters."));
		const fieldHelp = h("div", {
			className: "ordt-help",
			id: "ordt-field-help",
			hidden: true
		}, h("p", {}, "Where the words are looked for. Click an example to try it."), h("ul", {}, ...FIELD_EXAMPLES.map((example) => h("li", {}, h("strong", {}, SEARCH_FIELDS.find((o) => o.value === example.field).label), `: ${example.note}. `, exampleButton(example)))), h("p", {}, "Lucene ignores this choice: write the field in the query, e.g. title:ortofoto."));
		const fieldSelect = select(SEARCH_FIELDS, "", {
			name: "field",
			"aria-label": "Search in"
		});
		const whereHelp = h("div", {
			className: "ordt-help",
			id: "ordt-where-help",
			hidden: true
		}, h("ul", {}, ...WHERE_HELP.map((entry) => h("li", {}, h("strong", {}, WHERE_OPTIONS.find((o) => o.value === entry.value).label), `: ${entry.note}`, entry.box ? h("span", {}, " ", h("button", {
			className: "ordt-link ordt-example",
			type: "button",
			onclick: () => this.runBoxExample(entry.box)
		}, entry.box)) : null))), h("p", {}, "A record's extent is a rectangle. With Touches the area a record is found when its extent touches the area, so national and regional records show up too: in the Palermo box, catastale finds 125 records, the cadastral maps of the municipalities (a rectangle also touches the neighbouring provinces) and the national cadastral services."), h("p", {}, "With Inside the area only records whose extent lies entirely within the area are kept: catastale in the Palermo box finds 85, all municipal cadastral maps. Regional records that reach beyond the area are left out too."));
		const resourcesHelp = helpBox("ordt-resources-help", h("ul", {}, ...RESOURCES_HELP.map(([term, note]) => termItem(term, note))), h("p", {}, RESOURCES_NOTE));
		const availableAsHelp = textHelp("ordt-available-as-help", AVAILABLE_AS_HELP);
		const themeHelp = textHelp("ordt-theme-help", THEME_HELP);
		const keywordsHelp = textHelp("ordt-keywords-help", KEYWORDS_HELP);
		const organisationHelp = textHelp("ordt-organisation-help", ORGANISATION_HELP);
		const openDataHelp = textHelp("ordt-open-data-help", OPEN_DATA_HELP);
		const dateHelp = helpBox("ordt-date-help", h("p", {}, "The first three are dates of the resource, not of its metadata:"), h("ul", {}, ...DATE_HELP.map(([term, note]) => termItem(term, note))), h("p", {}, "Publishers usually fill in only one of the first three: depending on the type, 44% to 64% of the records lack it, and a date range leaves them out. If you get few results, try another date type. With both dates empty there is no date filter."));
		const sortHelp = helpBox("ordt-sort-help", h("ul", {}, ...SORT_HELP.map(([term, note]) => termItem(term, note))), h("p", {}, SORT_NOTE));
		this.copyQueryEl = h("button", {
			className: "ordt-button ordt-curl",
			type: "button",
			disabled: true,
			title: "Copy query as curl",
			"aria-label": "Copy query as curl",
			onclick: () => this.copyQuery()
		}, "curl");
		this.footprintsToggleEl = h("button", {
			className: "ordt-link",
			type: "button",
			disabled: true,
			onclick: () => this.toggleFootprints()
		}, "Hide footprints");
		this.advancedCountEl = h("span", {
			className: "ordt-count",
			hidden: true
		});
		this.helpEl = h("div", {
			className: "ordt-help-all",
			id: "ordt-help-all",
			hidden: true
		}, helpSection("Search modes", modeHelp), helpSection("Search in", fieldHelp), helpSection("Type", resourcesHelp), helpSection("Where", whereHelp), helpSection("Available as", availableAsHelp), helpSection("Sort by", sortHelp), helpSection("Recent searches", textHelp("ordt-history-help", ["A click in the search box lists your last 20 searches, newest first, with their filters; a record opened by its id is listed with its title. A click runs one again; typing narrows the list; × removes an entry.", "A search made on the map view is run again on the area it had then. The list stays on this computer; Settings turns it off."])));
		return h("form", {
			className: "ordt-form",
			id: FORM_ID,
			onsubmit: (event) => {
				event.preventDefault();
				const origin = this.refining ? "refine" : "new";
				this.refining = false;
				this.showHistory(false);
				this.search(1, void 0, null, origin);
			},
			onchange: () => this.updateAdvancedCount(),
			oninput: () => this.updateAdvancedCount()
		}, h("div", { className: "ordt-label" }, "Type", radioGroup("kind", KIND_OPTIONS, "all", toggleServiceTypes, "ordt-segmented")), serviceTypes, h("div", { className: "ordt-label" }, "Where", whereSelect), boxInput, spatialRel, h("div", { className: "ordt-label" }, "Available as", h("div", {
			className: "ordt-pills",
			role: "group",
			"aria-label": "Available as"
		}, ...LINK_KINDS.map((kind) => h("label", { className: "ordt-pill" }, h("input", {
			type: "checkbox",
			name: "availableAs",
			value: kind
		}), kind)))), h("details", { className: "ordt-more" }, h("summary", {}, h("span", {}, "Advanced filters ", this.advancedCountEl), h("span", { className: "ordt-more-hint" }, "text, theme, organisation, dates, sort")), h("div", { className: "ordt-label" }, "Match", radioGroup("textMode", TEXT_MODES, "all", () => void 0, "ordt-segmented")), h("div", { className: "ordt-label" }, "Search in", fieldSelect), h("div", { className: "ordt-label" }, h("span", { className: "ordt-label-head" }, "INSPIRE theme", helpToggle(themeHelp, "Help on INSPIRE themes")), themeHelp, themes), h("div", { className: "ordt-label" }, h("span", { className: "ordt-label-head" }, "Keywords ", h("span", { className: "ordt-hint" }, "· exact, case-sensitive, comma-separated"), helpToggle(keywordsHelp, "Help on keywords")), keywordsHelp, h("input", {
			className: "ordt-input",
			name: "keywords",
			placeholder: "opendata, Idrografia",
			"aria-label": "Keywords"
		})), h("div", { className: "ordt-label" }, h("span", { className: "ordt-label-head" }, "Organisation ", h("span", { className: "ordt-hint" }, "· comma-separated"), helpToggle(organisationHelp, "Help on organisation")), organisationHelp, h("div", { className: "ordt-row" }, h("input", {
			className: "ordt-input ordt-grow",
			name: "organisation",
			placeholder: "Regione Piemonte",
			"aria-label": "Organisation",
			oninput: () => this.syncClearButtons()
		}), this.clearButton("organisation", "organisation")), radioGroup("orgMode", ORG_MODES, "only", () => void 0, "ordt-segmented")), h("div", { className: "ordt-row" }, h("label", { className: "ordt-check" }, h("input", {
			type: "checkbox",
			name: "openData"
		}), "Open data only"), helpToggle(openDataHelp, "Help on open data")), openDataHelp, h("div", { className: "ordt-label" }, h("span", { className: "ordt-label-head" }, "Date", helpToggle(dateHelp, "Help on dates")), dateHelp, h("div", { className: "ordt-date-row" }, select(DATE_FIELDS$1, "apiso_RevisionDate_dt", {
			name: "dateField",
			"aria-label": "Date type"
		}), h("input", {
			className: "ordt-input",
			type: "date",
			name: "dateFrom",
			"aria-label": "From"
		}), h("input", {
			className: "ordt-input",
			type: "date",
			name: "dateTo",
			"aria-label": "To"
		})), h("div", { className: "ordt-row ordt-small ordt-date-presets" }, ...DATE_PRESETS.map(([label, days]) => h("button", {
			className: "ordt-link",
			type: "button",
			onclick: () => this.setDateFrom(days)
		}, label))), h("span", { className: "ordt-hint" }, "Most records carry only one of the three resource dates.")), h("div", { className: "ordt-label" }, "Sort by", select(SORT_OPTIONS, "", {
			name: "sort",
			"aria-label": "Sort by"
		})), h("div", { className: "ordt-row ordt-small" }, h("button", {
			className: "ordt-button ordt-primary",
			type: "submit"
		}, "Search"), h("button", {
			className: "ordt-link",
			type: "button",
			onclick: () => this.clearFilters()
		}, "Clear all"))));
	}
	/** Text box and Search button: outside the form so they can stay on top, tied to it by `form`. */
	buildSearchBar() {
		this.historyEl = h("div", {
			className: "ordt-history",
			id: "ordt-history",
			role: "listbox",
			"aria-label": "Recent searches",
			hidden: true
		});
		const input = h("input", {
			className: "ordt-input ordt-grow",
			name: "text",
			type: "search",
			form: FORM_ID,
			placeholder: "Search titles, abstracts, keywords…",
			"aria-label": "Free text",
			autocomplete: "off",
			role: "combobox",
			"aria-expanded": "false",
			"aria-controls": "ordt-history",
			onfocus: () => this.showHistory(true),
			onclick: () => this.showHistory(true),
			oninput: () => {
				this.historyHi = -1;
				this.historyTyped = true;
				this.showHistory(true);
			},
			onkeydown: (event) => this.historyKey(event)
		});
		this.historyEl.addEventListener("mousedown", (event) => {
			event.preventDefault();
			const target = event.target;
			const action = target.closest("[data-history]")?.dataset.history;
			const item = target.closest(".ordt-history-item");
			const entry = item ? this.shownHistory()[Number(item.dataset.index)] : void 0;
			if (action === "remove" && entry) this.removeFromHistory(entry);
			else if (action === "ask") this.historyConfirm = true;
			else if (action === "keep") this.historyConfirm = false;
			else if (action === "clear") this.forgetHistory();
			else if (entry) return this.runEntry(entry);
			this.renderHistory();
		});
		return h("div", { className: "ordt-row ordt-search-bar" }, input, h("button", {
			className: "ordt-button ordt-primary",
			type: "submit",
			form: FORM_ID
		}, "Search"), this.historyEl);
	}
	/**
	* The entries the list shows: all of them, or the ones holding the letters
	* typed. The text the box holds when the list opens is the search on screen,
	* not something typed to find an entry: it does not narrow the list.
	*/
	shownHistory() {
		if (!this.historyTyped) return this.history;
		const typed = this.field("text").value;
		return this.history.filter((entry) => matchesEntry(entry, typed));
	}
	/** Open the list under the search box, or close it. With nothing to show it stays closed. */
	showHistory(show) {
		if (!show) {
			this.historyHi = -1;
			this.historyConfirm = false;
			this.historyTyped = false;
		}
		this.historyEl.hidden = !show;
		this.renderHistory();
	}
	renderHistory() {
		const input = this.field("text");
		const shown = this.shownHistory();
		if (!shown.length) this.historyEl.hidden = true;
		input.setAttribute("aria-expanded", String(!this.historyEl.hidden));
		if (this.historyCountEl) {
			const n = this.history.length;
			this.historyCountEl.textContent = `${n} ${n === 1 ? "search" : "searches"}`;
		}
		if (this.historyEl.hidden) return this.historyEl.replaceChildren();
		this.historyHi = Math.min(this.historyHi, shown.length - 1);
		const filtered = shown.length < this.history.length;
		const total = this.history.length;
		this.historyEl.replaceChildren(h("div", { className: "ordt-history-head ordt-muted" }, h("span", {}, filtered ? `${shown.length} of ${total} recent searches` : "Recent searches"), h("span", {}, "↑↓ Enter · Esc")), h("div", { className: "ordt-history-list" }, ...shown.map((entry, index) => {
			const record = entry.kind === "record";
			const sub = record ? entry.recordId : entry.filters.length ? entry.filters.join(" · ") : "No filters";
			return h("div", {
				className: "ordt-history-item",
				role: "option",
				"data-index": String(index),
				"aria-selected": String(index === this.historyHi),
				onmouseenter: () => {
					this.historyHi = index;
					for (const el of this.historyEl.querySelectorAll(".ordt-history-item")) el.setAttribute("aria-selected", String(el === this.historyEl.querySelectorAll(".ordt-history-item")[index]));
				}
			}, h("div", { className: "ordt-history-main" }, h("div", { className: "ordt-history-row" }, record || entry.form.text.trim() ? h("span", { className: "ordt-history-text" }, record ? entry.title : entry.form.text.trim()) : h("em", { className: "ordt-history-text ordt-muted" }, "No text"), h("span", { className: "ordt-history-when ordt-muted" }, whenLabel(entry.time))), h("div", { className: "ordt-history-row ordt-muted" }, record && h("span", { className: "ordt-history-kind" }, "Record"), h("span", {
				className: record ? "ordt-history-sub ordt-history-id" : "ordt-history-sub",
				title: sub
			}, sub), !record && h("span", { className: "ordt-history-count" }, entry.total.toLocaleString("en")))), h("button", {
				className: "ordt-history-remove",
				type: "button",
				tabIndex: -1,
				"data-history": "remove",
				title: "Remove from history",
				"aria-label": "Remove from history"
			}, "×"));
		})), this.historyConfirm ? h("div", { className: "ordt-history-foot" }, h("span", {}, `Clear all ${total} ${total === 1 ? "search" : "searches"}?`), h("button", {
			className: "ordt-link ordt-danger",
			type: "button",
			tabIndex: -1,
			"data-history": "clear"
		}, "Clear"), h("button", {
			className: "ordt-link",
			type: "button",
			tabIndex: -1,
			"data-history": "keep"
		}, "Keep")) : h("div", { className: "ordt-history-foot" }, h("button", {
			className: "ordt-link ordt-danger",
			type: "button",
			tabIndex: -1,
			"data-history": "ask"
		}, "Clear history"), h("span", { className: "ordt-muted" }, "On this computer only")));
		this.historyEl.querySelector("[aria-selected=\"true\"]")?.scrollIntoView?.({ block: "nearest" });
	}
	/**
	* Keys of the search box with the list: ↓ opens it or goes down, ↑ goes up
	* and back to the box, Enter runs the highlighted entry (with none, the form
	* is submitted as always), Esc closes and keeps the text, Delete removes the
	* highlighted entry. Highlighting does not rewrite the box: an entry carries
	* filters too.
	*/
	historyKey(event) {
		const open = !this.historyEl.hidden;
		const shown = this.shownHistory();
		if (event.key === "ArrowDown" && shown.length) {
			event.preventDefault();
			this.historyHi = open ? Math.min(shown.length - 1, this.historyHi + 1) : 0;
			this.showHistory(true);
		} else if (event.key === "ArrowUp" && open) {
			event.preventDefault();
			this.historyHi = Math.max(-1, this.historyHi - 1);
			this.renderHistory();
		} else if (event.key === "Enter" && open && this.historyHi >= 0) {
			event.preventDefault();
			this.runEntry(shown[this.historyHi]);
		} else if (event.key === "Escape" && open) {
			event.preventDefault();
			this.showHistory(false);
		} else if (event.key === "Delete" && open && this.historyHi >= 0) {
			event.preventDefault();
			this.removeFromHistory(shown[this.historyHi]);
			this.renderHistory();
		}
	}
	removeFromHistory(entry) {
		if (this.history[0] === entry) this.tracksTop = false;
		this.history = withoutEntry(this.history, entry);
		saveHistory(this.history);
	}
	forgetHistory() {
		this.history = [];
		this.tracksTop = false;
		this.historyConfirm = false;
		clearHistory();
	}
	/**
	* Run an entry of the history again, from page 1, with all its filters. Its
	* area is the box saved then: the map goes to it, and its chip reads "Saved
	* area", since the view of now has nothing to do with it.
	*/
	runEntry(entry) {
		this.showHistory(false);
		if (entry.kind === "record") {
			this.field("text").value = entry.recordId;
			this.search(1);
			return;
		}
		this.writeForm(entry.form);
		if (entry.form.bbox) {
			const named = entry.filters.map((f) => f.replace(/^Inside: /, "")).find((f) => /^(Map view|Drawn shapes|Saved area|Box )/.test(f));
			this.savedArea = {
				box: this.field("box").value.trim(),
				label: named ?? "Saved area"
			};
			this.app.fitBounds?.(entry.form.bbox);
		}
		this.search(1);
	}
	/**
	* Keep the search just made in the history. A search started from the box, a
	* link or an entry adds one; a change of the search on screen (`refine`: a
	* chip removed; `page`: a page, the order) updates the entry on top. Not
	* kept: a search with no results, one restored from a project (`none`), any
	* with the setting off.
	*/
	remember(origin, form, record) {
		if (origin === "none" || !this.settings.rememberSearches || this.total === 0) {
			this.tracksTop = false;
			return;
		}
		if (origin === "page" && !this.tracksTop) return;
		const saved = this.savedArea && this.isSavedArea() ? this.savedArea.label : null;
		const entry = {
			kind: record ? "record" : "search",
			form: { ...form },
			filters: record ? [] : this.activeChips().map((chip) => saved ? chip.label.replace("Saved area", saved) : chip.label),
			recordId: record ? record.id : null,
			title: record ? record.title : "",
			total: this.total,
			time: (/* @__PURE__ */ new Date()).toISOString()
		};
		this.history = origin === "new" || !this.tracksTop ? withEntry(this.history, entry) : withTopUpdated(this.history, entry);
		this.tracksTop = true;
		saveHistory(this.history);
		this.renderHistory();
	}
	/** Whether the box in the form is the one a saved search brought. */
	isSavedArea() {
		return !!this.savedArea && this.field("box").value.trim() === this.savedArea.box;
	}
	/** Active filters as removable chips, "Edit filters" and "Clear all". Shown only with a filter: see {@link syncSummary}. */
	buildSummary() {
		this.chipsEl = h("div", { className: "ordt-chips" });
		this.summaryToggleEl = h("button", {
			className: "ordt-link",
			type: "button",
			onclick: () => this.showFilters(this.formEl.hidden === true)
		}, "Edit filters");
		this.clearAllEl = h("button", {
			className: "ordt-link",
			type: "button",
			title: "Remove all filters and search again; the text stays",
			onclick: () => {
				this.clearFilters();
				this.refining = true;
				this.formEl.requestSubmit();
			}
		}, "Clear all");
		return h("div", {
			className: "ordt-summary ordt-small",
			hidden: true
		}, this.chipsEl, h("span", { className: "ordt-summary-links" }, this.summaryToggleEl, this.clearAllEl));
	}
	/** Pager with the status between its arrows, curl, sort, the ⋯ menu; below, Zoom to results, Hide footprints and, with no filter, Filters. */
	buildResultsHead() {
		this.sortEl = select(SORT_OPTIONS, "", {
			className: "ordt-input ordt-sort",
			"aria-label": "Sort results",
			onchange: () => this.changeSort()
		});
		this.copyAgentLabelEl = h("span", {}, "Copy for an agent");
		this.shareLabelEl = h("span", {}, "Share");
		this.copyAgentHintEl = h("span", { className: "ordt-menu-hint ordt-muted" });
		const menu = h("div", {
			className: "ordt-menu",
			role: "menu",
			hidden: true
		}, h("button", {
			className: "ordt-menu-item ordt-share",
			type: "button",
			"data-keep-open": "",
			onclick: () => void this.share(this.shareLabelEl)
		}, this.shareLabelEl), h("button", {
			className: "ordt-menu-item ordt-copy-agent",
			type: "button",
			"data-keep-open": "",
			onclick: () => this.copyForAgent()
		}, this.copyAgentLabelEl, this.copyAgentHintEl), h("button", {
			className: "ordt-menu-item ordt-danger",
			type: "button",
			onclick: () => this.clearResults()
		}, "Clear results"));
		this.resultActionsEl = h("div", {
			className: "ordt-head-tools",
			hidden: true
		}, this.copyQueryEl, this.sortEl, menuWrap(menu, "More actions"));
		this.zoomLinkEl = this.app.fitBounds && h("button", {
			className: "ordt-link",
			type: "button",
			onclick: () => this.zoomToResults()
		}, "Zoom to results");
		this.filtersLinkEl = h("button", {
			className: "ordt-link ordt-filters-link",
			type: "button",
			hidden: true,
			onclick: () => this.showFilters(this.formEl.hidden === true)
		}, "Filters");
		this.zoomRowEl = h("div", {
			className: "ordt-row ordt-small",
			hidden: true
		}, this.zoomLinkEl, this.footprintsToggleEl, this.filtersLinkEl);
		return h("div", { className: "ordt-results-head" }, h("div", { className: "ordt-head-row" }, this.pagerTopEl, this.resultActionsEl), this.zoomRowEl);
	}
	buildFooter() {
		this.helpToggleEl = h("button", {
			className: "ordt-link",
			type: "button",
			"aria-expanded": "false",
			"aria-controls": this.helpEl.id,
			onclick: () => this.showHelp(this.helpEl.hidden === true)
		}, "Search help");
		this.settingsToggleEl = h("button", {
			className: "ordt-link",
			type: "button",
			"aria-expanded": "false",
			"aria-controls": this.settingsEl.id,
			onclick: () => this.showSettings(this.settingsEl.hidden === true)
		}, "⚙ Settings");
		return h("div", { className: "ordt-footer ordt-small" }, h("a", {
			className: "ordt-link",
			href: "https://geodati.gov.it/geoportale/",
			target: "_blank",
			rel: "noopener"
		}, "Italian geospatial catalogue"), h("span", { className: "ordt-footer-links" }, this.settingsToggleEl, this.helpToggleEl, repoLink()));
	}
	buildSettings() {
		const logBox = h("input", {
			type: "checkbox",
			name: "logErrors",
			checked: this.settings.logErrors,
			onchange: () => {
				this.settings = {
					...this.settings,
					logErrors: logBox.checked
				};
				saveSettings(this.settings);
			}
		});
		this.logCountEl = h("span", { className: "ordt-muted" });
		const historyBox = h("input", {
			type: "checkbox",
			name: "rememberSearches",
			checked: this.settings.rememberSearches,
			onchange: () => {
				this.settings = {
					...this.settings,
					rememberSearches: historyBox.checked
				};
				saveSettings(this.settings);
				if (!historyBox.checked) this.forgetHistory();
				this.renderHistory();
			}
		});
		this.historyCountEl = h("span", { className: "ordt-muted ordt-history-size" });
		return h("section", {
			className: "ordt-settings",
			id: "ordt-settings",
			hidden: true
		}, h("h3", {}, "Settings"), h("label", { className: "ordt-check" }, historyBox, "Remember my last 20 searches"), h("p", { className: "ordt-note" }, "Text, filters and area of each search, and the record opened by id. They are listed under the search box. Turning this off also clears the list."), h("div", { className: "ordt-row ordt-small" }, this.historyCountEl, h("button", {
			className: "ordt-link ordt-clear-history",
			type: "button",
			onclick: () => {
				this.forgetHistory();
				this.renderHistory();
			}
		}, "Clear history")), h("label", { className: "ordt-check" }, logBox, "Log service URLs that fail (unreachable or errors)"), h("p", { className: "ordt-note" }, "Each failure adds a line: time (UTC), record, organisation, service type, URL, error. Up to 1,000 lines, the oldest leave first. Settings, history and log stay on this computer."), h("div", { className: "ordt-row ordt-small" }, this.logCountEl, h("button", {
			className: "ordt-link",
			type: "button",
			onclick: () => this.exportErrorLog()
		}, "Export JSON Lines"), h("button", {
			className: "ordt-link",
			type: "button",
			onclick: () => {
				clearErrorLog();
				this.updateLogCount();
			}
		}, "Clear log")));
	}
	showSettings(show) {
		this.settingsEl.hidden = !show;
		this.settingsToggleEl.setAttribute("aria-expanded", String(show));
		if (!show) return;
		this.closeDetail(false);
		this.updateLogCount();
		this.settingsEl.scrollIntoView?.({ block: "start" });
	}
	updateLogCount() {
		const count = readErrorLog().length;
		this.logCountEl.textContent = `${count.toLocaleString("en")} ${count === 1 ? "entry" : "entries"}`;
	}
	/** Save the log through the host's "Save as" dialog, or as a download on the web. */
	exportErrorLog() {
		const content = errorLogJsonl(readErrorLog());
		const filename = "openrndt-errors.jsonl";
		if (this.app.exportTextFile) {
			this.app.exportTextFile(filename, content, {
				description: "JSON Lines",
				extensions: ["jsonl"],
				mimeType: "application/jsonl"
			});
			return;
		}
		const url = URL.createObjectURL(new Blob([content], { type: "application/jsonl" }));
		h("a", {
			href: url,
			download: filename
		}).click();
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}
	/** Add a failing service to the log, when the user turned it on. */
	logError(record, service, error) {
		if (!this.settings.logErrors) return;
		appendErrorLog({
			time: (/* @__PURE__ */ new Date()).toISOString(),
			recordId: record.id,
			recordTitle: record.title,
			organisation: record.organisation,
			serviceKind: service.kind,
			url: service.url,
			error
		});
		if (!this.settingsEl.hidden) this.updateLogCount();
	}
	/** Show "Search help" above the results, with the filters it explains; or hide it. */
	showHelp(show) {
		this.helpEl.hidden = !show;
		this.helpToggleEl.setAttribute("aria-expanded", String(show));
		if (!show) return;
		this.closeDetail(false);
		this.showFilters(true);
		this.helpEl.scrollIntoView?.({ block: "start" });
	}
	/** Sort from the results header: the same search again, from the first page. */
	changeSort() {
		this.field("sort").value = this.sortEl.value;
		this.updateAdvancedCount();
		if (this.lastForm) this.search(1, {
			...this.lastForm,
			sort: this.sortEl.value
		}, null, "page");
	}
	/** Empty every filter, the area too (Anywhere); the text and the sort order stay. Nothing is searched. */
	clearFilters() {
		const text = this.field("text").value;
		const sort = this.field("sort").value;
		this.formEl.reset();
		this.field("text").value = text;
		this.field("sort").value = sort;
		this.field("where").value = "anywhere";
		this.afterReset();
	}
	/** Unfold or fold the filters; the chip line stays as their handle. */
	showFilters(show) {
		this.formEl.hidden = !show;
		this.summaryToggleEl.textContent = show ? "Hide filters" : "Edit filters";
		this.filtersLinkEl.textContent = show ? "Hide filters" : "Filters";
		if (show && this.advancedCount() > 0) this.formEl.querySelector(".ordt-more").open = true;
	}
	updateStickyHeights() {
		if (!this.root) return;
		this.root.style.setProperty("--ordt-bar-h", `${this.searchBarEl.offsetHeight}px`);
		this.root.style.setProperty("--ordt-head-h", `${this.resultsHeadEl.offsetHeight}px`);
		this.root.style.setProperty("--ordt-foot-h", `${this.footerEl.offsetHeight}px`);
	}
	/**
	* The results header sticks just below the search bar, and a record scrolled
	* into view must clear both: their heights go into CSS variables.
	*/
	trackStickyHeights() {
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => this.updateStickyHeights());
		observer.observe(this.searchBarEl);
		observer.observe(this.resultsHeadEl);
		observer.observe(this.footerEl);
		this.stickyObserver = observer;
	}
	/** Filters set in "Advanced filters", sort order included. */
	advancedCount() {
		const mode = checkedValue(this.formEl, "textMode");
		return [
			mode && mode !== "all",
			this.field("field").value,
			this.field("theme").value,
			this.field("keywords").value.trim(),
			this.field("organisation").value.trim(),
			this.field("openData").checked,
			this.field("dateFrom").value || this.field("dateTo").value,
			this.field("sort").value
		].filter(Boolean).length;
	}
	updateAdvancedCount() {
		const count = this.advancedCount();
		this.advancedCountEl.hidden = count === 0;
		this.advancedCountEl.textContent = String(count);
	}
	/**
	* One chip per active filter, each with the way to remove it. Read from the
	* form, so a chip always matches what the next search sends. The text has
	* no chip (it is in the search bar), nor has the sort order (in the header).
	*/
	activeChips() {
		const selected = (name) => this.field(name).selectedOptions[0]?.text ?? "";
		const setRadio = (name, value) => this.formEl.querySelector(`input[name="${name}"][value="${value}"]`).checked = true;
		const chips = [];
		const mode = checkedValue(this.formEl, "textMode");
		if (mode && mode !== "all") chips.push({
			label: TEXT_MODES.find((o) => o.value === mode).label,
			clear: () => setRadio("textMode", "all")
		});
		if (this.field("field").value) chips.push({
			label: `In ${selected("field")}`,
			clear: () => this.field("field").value = ""
		});
		const kind = checkedValue(this.formEl, "kind");
		if (kind && kind !== "all") chips.push({
			label: KIND_OPTIONS.find((o) => o.value === kind).label,
			clear: () => {
				setRadio("kind", "all");
				for (const box of this.formEl.querySelectorAll("input[name=\"serviceType\"]")) box.checked = false;
				this.formEl.querySelector(".ordt-service-types").hidden = true;
			}
		});
		for (const box of this.formEl.querySelectorAll("input[name=\"serviceType\"]:checked, input[name=\"availableAs\"]:checked")) chips.push({
			label: box.closest("label").textContent.trim(),
			clear: () => box.checked = false
		});
		const where = this.field("where");
		if (where.value !== "anywhere") {
			const area = where.value === "box" ? this.isSavedArea() ? "Saved area" : `Box ${this.field("box").value.trim()}` : where.value === "view" ? "Map view" : "Drawn shapes";
			chips.push({
				label: checkedValue(this.formEl, "spatialRel") === "Within" ? `Inside: ${area}` : area,
				clear: () => {
					where.value = "anywhere";
					where.dispatchEvent(new Event("change"));
				}
			});
		}
		if (this.field("theme").value) chips.push({
			label: selected("theme"),
			clear: () => this.field("theme").value = ""
		});
		const keywords = this.field("keywords").value.trim();
		if (keywords) chips.push({
			label: `Keywords: ${keywords}`,
			clear: () => this.field("keywords").value = ""
		});
		const organisation = this.field("organisation");
		const names = organisation.value.split(",").map((n) => n.trim()).filter(Boolean);
		const hiding = checkedValue(this.formEl, "orgMode") === "hide";
		for (const name of names) chips.push({
			label: `${hiding ? "Hiding" : "Only"}: ${name}`,
			clear: () => {
				organisation.value = names.filter((n) => n !== name).join(", ");
				this.syncClearButtons();
			}
		});
		if (this.field("openData").checked) chips.push({
			label: "Open data only",
			clear: () => this.field("openData").checked = false
		});
		const from = this.field("dateFrom").value;
		const to = this.field("dateTo").value;
		if (from || to) chips.push({
			label: `${selected("dateField")} ${from || "…"} to ${to || "…"}`,
			clear: () => {
				this.field("dateFrom").value = "";
				this.field("dateTo").value = "";
			}
		});
		return chips;
	}
	/** Rebuild the chip line from the form; × removes one filter and searches again. */
	renderChips() {
		const chips = this.activeChips();
		this.chipsEl.replaceChildren(...chips.map((chip) => h("span", { className: "ordt-chip" }, chip.label, h("button", {
			className: "ordt-chip-remove",
			type: "button",
			"aria-label": `Remove ${chip.label}`,
			title: "Remove this filter and search again",
			onclick: () => {
				chip.clear();
				this.refining = true;
				this.formEl.requestSubmit();
			}
		}, "×"))));
		this.updateAdvancedCount();
		this.clearAllEl.hidden = chips.length === 0;
	}
	/** After a search: the chip row with a filter, the Filters link in the results header with none. */
	syncSummary() {
		const filtered = this.chipsEl.childElementCount > 0;
		this.summaryEl.hidden = !filtered;
		this.filtersLinkEl.hidden = filtered;
	}
	/** Turn on GeoEditor when "Drawn shapes" is picked and nothing is drawn yet. */
	async prepareDrawing() {
		if (drawnBbox(this.app)) {
			this.setStatus("Search will use the shapes drawn with GeoEditor.");
			return;
		}
		const activated = await this.app.activatePlugin?.("maplibre-gl-geo-editor").catch(() => false) ?? false;
		this.setStatus(activated ? "GeoEditor is on: draw a rectangle or polygon on the map, then press Search." : "Turn on GeoEditor (Plugins > GeoEditor), draw a shape, then press Search.");
	}
	/** A preset: From goes back the given days from today, To is left open. */
	setDateFrom(days) {
		const date = /* @__PURE__ */ new Date();
		date.setDate(date.getDate() - days);
		this.field("dateFrom").value = localIsoDate(date);
		this.field("dateTo").value = "";
		this.updateAdvancedCount();
	}
	afterReset() {
		this.formEl.querySelector(".ordt-service-types").hidden = true;
		const where = this.field("where").value;
		this.formEl.querySelector("input[name=\"box\"]").hidden = where !== "box";
		this.formEl.querySelector(".ordt-spatial-rel").hidden = where === "anywhere";
		this.syncClearButtons();
		this.updateAdvancedCount();
	}
	/** The × that empties a text field; hidden while the field is empty. */
	clearButton(field, label) {
		return h("button", {
			className: "ordt-clear",
			type: "button",
			hidden: true,
			"data-field": field,
			"aria-label": `Clear ${label}`,
			title: `Clear ${label} and search again`,
			onclick: () => this.clearField(field)
		}, "×");
	}
	/** Show each × only when its field has a value. */
	syncClearButtons() {
		for (const button of this.formEl.querySelectorAll(".ordt-clear[data-field]")) button.hidden = !this.field(button.dataset.field).value.trim();
	}
	/** Empty a filter field and, after a search, search again without it. */
	clearField(name) {
		const input = this.field(name);
		input.value = "";
		this.syncClearButtons();
		input.focus();
		if (!this.lastForm) return;
		this.refining = true;
		this.formEl.requestSubmit();
	}
	field(name) {
		return this.root.querySelector(`[name="${name}"]`);
	}
	/** Read the form. Throws with a user-facing message on invalid input. */
	readForm() {
		const form = emptyForm();
		form.text = this.field("text").value;
		form.textMode = checkedValue(this.formEl, "textMode") || "all";
		form.field = this.field("field").value;
		form.kind = checkedValue(this.formEl, "kind") || "all";
		form.availableAs = Array.from(this.formEl.querySelectorAll("input[name=\"availableAs\"]:checked"), (el) => el.value);
		form.serviceTypes = Array.from(this.formEl.querySelectorAll("input[name=\"serviceType\"]:checked"), (el) => el.value);
		const theme = this.field("theme").value;
		form.inspireThemes = theme ? [theme] : [];
		form.keywords = this.field("keywords").value;
		form.organisation = this.field("organisation").value;
		form.invertOrganisation = checkedValue(this.formEl, "orgMode") === "hide";
		form.openDataOnly = this.field("openData").checked;
		form.dateField = this.field("dateField").value;
		form.dateFrom = this.field("dateFrom").value;
		form.dateTo = this.field("dateTo").value;
		form.sort = this.field("sort").value;
		form.bbox = this.readWhere(this.field("where").value);
		form.spatialRel = checkedValue(this.formEl, "spatialRel") || "Intersects";
		return form;
	}
	readWhere(where) {
		if (where === "anywhere") return null;
		if (where === "view") {
			const view = this.app.getViewBounds?.();
			if (!view) throw new Error("The map view is not available.");
			return clampBbox(view);
		}
		if (where === "drawn") {
			const box = drawnBbox(this.app);
			if (!box) throw new Error("Draw a shape first with the GeoEditor plugin (Plugins > GeoEditor), or pick another area.");
			return clampBbox(box);
		}
		const parts = this.field("box").value.split(/[\s,;]+/).filter(Boolean).map(Number);
		const box = parts;
		const error = parts.length === 4 ? bboxError(box) : "The box needs four numbers: west, south, east, north.";
		if (error) throw new Error(error);
		return box;
	}
	setStatus(message, kind = "info") {
		this.statusEl.textContent = message;
		this.statusEl.dataset.kind = kind;
	}
	async search(start, form, openId = null, origin = "new") {
		const id = form ? null : recordIdIn(this.field("text").value);
		let current;
		let url = null;
		try {
			current = withEffectiveSort(form ?? this.readForm());
			url = buildSearchUrl(RNDT_BASE_URL, current, start, 20);
		} catch (error) {
			if (!id) {
				this.setStatus(errorMessage(error), "error");
				return;
			}
			current = emptyForm();
		}
		const seq = ++this.requestSeq;
		this.setStatus("Searching the RNDT catalogue…", "busy");
		try {
			const fetchPage = async (pageUrl) => parseSearchResponse(await fetchJson(this.app, pageUrl, { download: true }), RNDT_BASE_URL);
			let page = null;
			let byId = false;
			if (id) {
				const found = await fetchPage(buildSearchUrl(RNDT_BASE_URL, idForm(id), 1, 20));
				const exact = found.records.filter((r) => r.id === id);
				if (exact.length === 1) [page, current, start, byId] = [
					{
						...found,
						total: 1,
						records: exact
					},
					idForm(id),
					1,
					true
				];
			}
			if (!page) {
				if (!url) throw new Error(`No record with id ${id}, and the form cannot be searched.`);
				page = await fetchPage(url);
			}
			if (seq !== this.requestSeq) return;
			this.lastForm = current;
			this.lastId = byId ? id : null;
			if (byId) {
				this.chipsEl.replaceChildren();
				this.syncSummary();
				this.showFilters(false);
				this.showHelp(false);
			} else if (!form) {
				this.renderChips();
				this.syncSummary();
				this.showFilters(false);
				this.showHelp(false);
			}
			this.sortEl.value = current.sort;
			this.closeDetail(false);
			this.records = page.records;
			this.total = page.total;
			this.start = start;
			this.copyQueryEl.disabled = false;
			this.footprintsOverlay()?.setData(footprints(page.records));
			this.renderResults();
			this.updateFootprintControls();
			this.remember(origin, current, byId ? page.records[0] : null);
			if (byId) this.openDetail(page.records[0].id);
			else if (openId) this.openDetail(openId);
		} catch (error) {
			if (seq !== this.requestSeq) return;
			this.setStatus(`Search failed: ${errorMessage(error)}`, "error");
		}
	}
	clearResults() {
		this.requestSeq++;
		this.records = [];
		this.total = 0;
		this.lastForm = null;
		this.tracksTop = false;
		this.footprintsLayer?.clear();
		if (this.copyQueryEl) this.copyQueryEl.disabled = true;
		if (this.footprintsToggleEl) this.updateFootprintControls();
		if (!this.root) return;
		this.closeDetail(false);
		this.listEl.replaceChildren();
		this.pagerEl.replaceChildren();
		this.pagerTopEl.replaceChildren(this.statusEl);
		this.resultActionsEl.hidden = true;
		this.zoomRowEl.hidden = true;
		this.summaryEl.hidden = true;
		this.emptyEl.hidden = true;
		this.showFilters(true);
		this.setStatus("Results cleared.");
	}
	/** Hide all footprints, or show them all again (also those hidden one by one). */
	toggleFootprints() {
		const layer = this.footprintsLayer;
		if (!layer) return;
		layer.setVisible(!layer.isVisible());
		this.updateFootprintControls();
	}
	toggleFootprint(recordId) {
		const layer = this.footprintsLayer;
		if (!layer) return;
		layer.setHidden(recordId, !layer.isHidden(recordId));
		this.updateFootprintControls();
	}
	/** Sync the global and per-record footprint links with the layer state. */
	updateFootprintControls() {
		const layer = this.footprintsLayer;
		const allVisible = layer?.isVisible() ?? true;
		this.footprintsToggleEl.disabled = !layer || !this.records.some((r) => r.bbox);
		this.footprintsToggleEl.textContent = allVisible ? "Hide footprints" : "Show footprints";
		for (const button of Array.from(this.root?.querySelectorAll(".ordt-footprint-toggle") ?? [])) {
			const id = button.dataset.id;
			button.textContent = layer?.isHidden(id) ? "Show footprint" : "Hide footprint";
			button.disabled = !allVisible;
			button.title = allVisible ? "" : "All footprints are hidden: use Show footprints first";
		}
	}
	/** Copy a curl command that repeats the search page on screen. */
	copyQuery() {
		if (!this.lastForm) return;
		const command = buildCurlCommand(RNDT_BASE_URL, this.lastForm, this.start, 20);
		const button = this.copyQueryEl;
		navigator.clipboard?.writeText(command).then(() => {
			button.textContent = "✓ copied";
			setTimeout(() => button.textContent = "curl", 1500);
		}, () => this.setStatus("Could not copy to the clipboard.", "error"));
	}
	/**
	* Share the search on screen, or the record open, as a GeoLibre web link
	* (#31): through the system share sheet where the browser offers one, else
	* copied to the clipboard. A share sheet closed without sharing is not an error.
	* `record`: the record of the detail view's own menu.
	*/
	async share(label, record) {
		const state = this.projectState();
		if (!state && !record) return;
		const url = shareUrl(state?.form ?? emptyForm(), record?.id ?? state?.recordId ?? null);
		const title = record ? `RNDT: ${record.title}` : state?.form.text ? `RNDT: ${state.form.text}` : "RNDT search";
		const show = (text) => {
			label.textContent = text;
			setTimeout(() => label.textContent = "Share", 3e3);
		};
		if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare({
			title,
			url
		}))) try {
			await navigator.share({
				title,
				url
			});
			return;
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
		}
		try {
			await navigator.clipboard.writeText(url);
			show("Link copied");
		} catch {
			this.setStatus("Could not copy the link to the clipboard.", "error");
		}
	}
	/** Copy the search on screen, its page of records and the commands to go on, as Markdown for an AI agent. */
	copyForAgent() {
		if (!this.lastForm) return;
		const text = agentText({
			form: this.lastForm,
			records: this.records,
			total: this.total,
			start: this.start,
			num: 20
		});
		const label = this.copyAgentLabelEl;
		navigator.clipboard?.writeText(text).then(() => {
			label.textContent = "Copied: paste it into your agent";
			setTimeout(() => label.textContent = "Copy for an agent", 3e3);
		}, () => this.setStatus("Could not copy to the clipboard.", "error"));
	}
	zoomToResults() {
		const boxes = this.records.map((r) => r.bbox).filter((b) => !!b);
		if (!boxes.length || !this.app.fitBounds) return;
		this.app.fitBounds([
			Math.min(...boxes.map((b) => b[0])),
			Math.min(...boxes.map((b) => b[1])),
			Math.max(...boxes.map((b) => b[2])),
			Math.max(...boxes.map((b) => b[3]))
		]);
	}
	renderResults() {
		const end = this.start + this.records.length - 1;
		this.setStatus(this.total === 0 ? "No records found." : `${this.start}-${end} of ${this.total.toLocaleString("en")}`);
		this.listEl.replaceChildren(...this.records.map((r) => this.renderRecord(r)));
		const shown = this.records.length;
		this.copyAgentHintEl.textContent = `This search, its ${shown === 1 ? "result" : `${shown} results`} and the commands to go on`;
		this.resultActionsEl.hidden = this.total === 0;
		const mapped = this.records.some((r) => r.bbox);
		if (this.zoomLinkEl) this.zoomLinkEl.hidden = !mapped;
		this.footprintsToggleEl.hidden = !mapped;
		this.zoomRowEl.hidden = !mapped && this.filtersLinkEl.hidden;
		this.renderRemedies();
		if (this.total > 20) {
			const [previous, next] = this.pagerButtons(end, true);
			this.pagerTopEl.replaceChildren(previous, this.statusEl, next);
			this.pagerEl.replaceChildren(...this.pagerButtons(end, false));
		} else {
			this.pagerTopEl.replaceChildren(this.statusEl);
			this.pagerEl.replaceChildren();
		}
	}
	/**
	* With no record found, the changes to the search just made that can find
	* some: each link makes the change and searches again. Nothing when none
	* applies, or when the search was for a record id.
	*/
	renderRemedies() {
		const remedies = [];
		const form = this.lastForm;
		if (this.total === 0 && form && this.lastId === null) {
			const where = this.field("where");
			if (where.value === "view") remedies.push(h("button", {
				className: "ordt-link",
				type: "button",
				onclick: () => {
					where.value = "anywhere";
					where.dispatchEvent(new Event("change"));
					this.formEl.requestSubmit();
				}
			}, "Search Anywhere instead of the map view"));
			const words = form.text.trim().split(/\s+/).filter(Boolean);
			if (form.textMode === "all" && words.length > 1) remedies.push(h("button", {
				className: "ordt-link",
				type: "button",
				onclick: () => {
					this.formEl.querySelector("input[name=\"textMode\"][value=\"any\"]").checked = true;
					this.formEl.requestSubmit();
				}
			}, `Match any word (${words.join(" or ")})`));
		}
		this.emptyEl.replaceChildren(...remedies.length ? [h("span", { className: "ordt-muted" }, "Try:"), ...remedies] : []);
		this.emptyEl.hidden = remedies.length === 0;
	}
	/** Previous/Next for the current page: compact arrows in the header, words below the list. */
	pagerButtons(end, compact) {
		const go = (start) => void this.search(start, this.lastForm ?? void 0, null, "page").then(() => this.listEl.firstElementChild?.scrollIntoView?.({ block: "start" }));
		return [h("button", {
			className: "ordt-button",
			type: "button",
			"aria-label": "Previous page",
			disabled: this.start <= 1,
			onclick: () => go(Math.max(1, this.start - 20))
		}, compact ? "‹" : "‹ Previous"), h("button", {
			className: "ordt-button",
			type: "button",
			"aria-label": "Next page",
			disabled: end >= this.total,
			onclick: () => go(this.start + 20)
		}, compact ? "›" : "Next ›")];
	}
	/**
	* Show one record in its own view, in place of filters and list (from its
	* title in the list or its footprint on the map). The search bar and the
	* footer stay.
	*/
	openDetail(id) {
		const record = this.records.find((r) => r.id === id);
		if (!record || !this.root) return;
		this.detailId = id;
		this.footprintsLayer?.select(id);
		this.detailRows = [];
		for (const li of this.listEl.querySelectorAll(".ordt-last-viewed")) li.classList.remove("ordt-last-viewed");
		this.detailEl.replaceChildren(...this.renderDetail(record).filter((c) => !!c));
		this.detailEl.hidden = false;
		this.detailBarEl.replaceChildren(h("button", {
			className: "ordt-link ordt-back",
			type: "button",
			onclick: () => this.closeDetail(true)
		}, `← ${this.total.toLocaleString("en")} ${this.total === 1 ? "result" : "results"}`), h("span", { className: "ordt-detail-position ordt-muted" }, `${this.records.indexOf(record) + 1} of ${this.records.length}`));
		this.detailBarEl.hidden = false;
		this.root.classList.add("ordt-in-detail");
		this.fitAbstract();
		this.searchBarEl.scrollIntoView?.({ block: "start" });
	}
	/**
	* Back to the list. With `back` (the "← N results" link) the card of the
	* record just seen is highlighted and brought to the top of the list, and its
	* footprint stays selected, so list and map show where you were.
	*/
	closeDetail(back) {
		if (this.detailId === null) return;
		const id = this.detailId;
		this.detailId = null;
		this.detailRows = [];
		this.detailEl.hidden = true;
		this.detailEl.replaceChildren();
		this.detailBarEl.hidden = true;
		this.detailBarEl.replaceChildren();
		this.root?.classList.remove("ordt-in-detail");
		const card = back ? Array.from(this.listEl.children).find((li) => li.dataset.id === id) : void 0;
		if (!card) {
			this.footprintsLayer?.select(null);
			return;
		}
		card.classList.add("ordt-last-viewed");
		this.updateStickyHeights();
		card.scrollIntoView?.({ block: "start" });
	}
	/** Mark the result whose footprint is hovered on the map. */
	markHovered(id) {
		for (const li of Array.from(this.listEl.children)) li.classList.toggle("ordt-hovered", li.dataset.id === id);
	}
	renderRecord(record) {
		const kinds = Array.from(new Set(record.services.map((s) => s.kind)));
		const li = h("li", {
			className: "ordt-result",
			"data-id": record.id
		}, h("button", {
			className: "ordt-result-title",
			type: "button",
			title: "Show details and zoom to the extent",
			onclick: () => {
				this.openDetail(record.id);
				if (record.bbox) this.app.fitBounds?.(record.bbox);
			}
		}, record.title), this.recordMenu(record), h("div", { className: "ordt-meta" }, record.type && h("span", { className: "ordt-muted" }, record.type), ...kinds.map((k) => h("span", { className: "ordt-badge ordt-badge-service" }, k))), h("div", { className: "ordt-meta ordt-meta-org" }, h("span", {
			className: "ordt-org-name",
			title: record.organisation
		}, record.organisation), record.modified && h("span", { className: "ordt-muted ordt-date" }, `Metadata ${record.modified}`)));
		if (record.bbox) {
			li.addEventListener("mouseenter", () => this.footprintsLayer?.highlight(record.id));
			li.addEventListener("mouseleave", () => this.footprintsLayer?.highlight(null));
		}
		return li;
	}
	/** The ⋯ of a result: keep or hide its organisation, zoom, hide its footprint. */
	recordMenu(record) {
		const items = [];
		if (record.organisation) items.push(h("button", {
			className: "ordt-menu-item ordt-hide-org",
			type: "button",
			onclick: () => this.excludeOrganisation(record.organisation)
		}, "Hide results from ", h("strong", {}, record.organisation)), h("button", {
			className: "ordt-menu-item ordt-org",
			type: "button",
			onclick: () => this.filterByOrganisation(record.organisation)
		}, "Show only this organisation"));
		if (record.bbox && this.app.fitBounds) items.push(h("button", {
			className: "ordt-menu-item",
			type: "button",
			onclick: () => this.app.fitBounds(record.bbox)
		}, "Zoom to extent"));
		if (record.bbox && this.footprintsLayer) items.push(h("button", {
			className: "ordt-menu-item ordt-footprint-toggle",
			type: "button",
			"data-id": record.id,
			disabled: !this.footprintsLayer.isVisible(),
			onclick: () => this.toggleFootprint(record.id)
		}, this.footprintsLayer.isHidden(record.id) ? "Show footprint" : "Hide footprint"));
		return menuWrap(h("div", {
			className: "ordt-menu",
			role: "menu",
			hidden: true
		}, ...items), "Record actions");
	}
	renderDetail(record) {
		const kinds = Array.from(new Set(record.services.map((s) => s.kind)));
		const more = [h("a", {
			className: "ordt-menu-item",
			href: record.xmlUrl,
			target: "_blank",
			rel: "noopener"
		}, "ISO XML"), h("button", {
			className: "ordt-menu-item",
			type: "button",
			title: record.id,
			onclick: () => void navigator.clipboard?.writeText(record.id).catch(() => void 0)
		}, "Copy id")];
		const shareLabel = h("span", {}, "Share");
		more.unshift(h("button", {
			className: "ordt-menu-item ordt-share",
			type: "button",
			"data-keep-open": "",
			onclick: () => void this.share(shareLabel, record)
		}, shareLabel));
		if (record.bbox && this.footprintsLayer) more.push(h("button", {
			className: "ordt-menu-item ordt-footprint-toggle",
			type: "button",
			"data-id": record.id,
			disabled: !this.footprintsLayer.isVisible(),
			onclick: () => this.toggleFootprint(record.id)
		}, this.footprintsLayer.isHidden(record.id) ? "Show footprint" : "Hide footprint"));
		return [
			h("h2", { className: "ordt-detail-title" }, record.title),
			h("div", { className: "ordt-meta" }, record.type && h("span", { className: "ordt-muted" }, record.type), ...kinds.map((k) => h("span", { className: "ordt-badge ordt-badge-service" }, k))),
			record.modified && h("div", { className: "ordt-small ordt-muted" }, `Metadata updated ${record.modified}`),
			...this.renderContact(record),
			record.abstract && this.renderAbstract(record.abstract),
			record.services.length ? h("ul", { className: "ordt-services" }, ...servicesWithDerivedWms(record.services).map((g) => this.renderService(record, g))) : !record.otherLinks.length && h("p", { className: "ordt-muted" }, "No services or downloads declared in this record."),
			record.otherLinks.length > 0 && h("div", { className: "ordt-other-links" }, h("p", { className: "ordt-muted" }, "Other links (web pages, folders: the plugin cannot add them to the map)"), h("ul", {}, ...record.otherLinks.map((url) => {
				const parsed = new URL(url);
				return h("li", {}, h("a", {
					className: "ordt-link",
					href: url,
					target: "_blank",
					rel: "noopener"
				}, `${parsed.host}${parsed.pathname}`), " ", this.copyButton(url));
			}))),
			h("div", { className: "ordt-row ordt-small ordt-detail-actions" }, record.bbox && this.app.fitBounds && h("button", {
				className: "ordt-link",
				type: "button",
				onclick: () => this.app.fitBounds(record.bbox)
			}, "Zoom to extent"), h("a", {
				className: "ordt-link",
				href: record.htmlUrl,
				target: "_blank",
				rel: "noopener"
			}, "Metadata"), menuWrap(h("div", {
				className: "ordt-menu",
				role: "menu",
				hidden: true
			}, ...more), "More record actions"))
		];
	}
	/**
	* The organisation's row with its Contact link, and the box the link opens
	* right under it: what the record says (about, organisation, contact) and an
	* email ready to copy, for any request to who publishes the data. The link is
	* there with no address too: the email then asks RNDT whom to write to.
	*/
	renderContact(record) {
		const email = contactEmail(record);
		const toContact = record.contactEmails.length > 0;
		const preview = h("pre", {
			className: "ordt-contact-text",
			hidden: true
		}, emailText(email));
		const show = h("button", {
			className: "ordt-link ordt-contact-show",
			type: "button"
		}, "Show text");
		show.addEventListener("click", () => {
			preview.hidden = !preview.hidden;
			show.textContent = preview.hidden ? "Show text" : "Hide text";
		});
		const box = h("div", {
			className: "ordt-contact ordt-small",
			hidden: true
		}, h("dl", { className: "ordt-contact-rows" }, h("dt", {}, "About"), h("dd", {}, h("span", {}, record.title), h("code", {}, record.id)), h("dt", {}, "Organisation"), h("dd", { className: record.organisation ? "" : "ordt-muted" }, record.organisation || "Not named in the record"), h("dt", {}, "Contact"), toContact ? h("dd", {}, ...record.contactEmails.map((address) => h("span", { className: "ordt-contact-address" }, address)), h("span", { className: "ordt-muted" }, "point of contact named in the record")) : h("dd", { className: "ordt-muted" }, "This record gives no email address.")), h("p", { className: "ordt-muted" }, toContact ? "A question on the data, its licence, an update, another format: the email names this record, you write the request." : "RNDT runs the catalogue and can tell you whom to write to. The email asks them for the organisation's contact for this record."), h("div", { className: "ordt-row ordt-contact-actions" }, copyEmailControl(toContact ? "Copy email" : "Copy email to RNDT", email, toContact ? email.to.join(", ") : "RNDT", "ordt-copy-email", "Copy recipients, subject and text of an email about this record"), show), preview);
		const link = h("button", {
			className: "ordt-link ordt-contact-link",
			type: "button",
			"aria-expanded": "false"
		}, "Contact");
		link.addEventListener("click", () => {
			box.hidden = !box.hidden;
			link.textContent = box.hidden ? "Contact" : "Close";
			link.setAttribute("aria-expanded", String(!box.hidden));
		});
		return [h("div", { className: "ordt-org-row ordt-small" }, h("span", {}, record.organisation), link), box];
	}
	/** The abstract cut at a few lines, with More / Less: a long one pushed the first service below the fold. */
	renderAbstract(abstract) {
		const text = h("p", { className: "ordt-abstract ordt-clamped" }, abstract);
		const toggle = h("button", {
			className: "ordt-link ordt-abstract-toggle",
			type: "button"
		}, "More");
		toggle.addEventListener("click", () => {
			toggle.textContent = text.classList.toggle("ordt-clamped") ? "More" : "Less";
		});
		return h("div", { className: "ordt-abstract-wrap" }, text, toggle);
	}
	/** No More link under an abstract that fits. Without layout (a hidden panel) the link stays. */
	fitAbstract() {
		const text = this.detailEl.querySelector(".ordt-abstract");
		const toggle = this.detailEl.querySelector(".ordt-abstract-toggle");
		if (text && toggle && text.clientHeight > 0) toggle.hidden = text.scrollHeight <= text.clientHeight;
	}
	copyButton(value, label = "Copy URL") {
		const button = h("button", {
			className: "ordt-link",
			type: "button",
			title: value
		}, label);
		button.addEventListener("click", () => {
			navigator.clipboard?.writeText(value).then(() => {
				button.textContent = "Copied";
				setTimeout(() => button.textContent = label, 1500);
			}, () => void 0);
		});
		return button;
	}
	/**
	* One service of the record. A WMS or WFS reads its capabilities as soon as
	* the detail view opens and lists its layers; a GeoJSON download gets an
	* "Add to map" button; every service gets Open and Copy URL.
	*/
	renderService(record, service) {
		const area = h("div", { className: "ordt-service-area" });
		const countEl = h("strong", { className: "ordt-layer-count" });
		const actions = [];
		if (service.kind === "download" && isGeoJsonUrl(service.url) && this.app.addGeoJsonLayer) {
			const add = h("button", {
				className: "ordt-button",
				type: "button"
			}, "Add to map");
			add.addEventListener("click", () => {
				add.disabled = true;
				this.addGeoJson(record, service, area).finally(() => add.disabled = false);
			});
			actions.push(add);
		}
		actions.push(h("a", {
			className: "ordt-link",
			href: service.url,
			target: "_blank",
			rel: "noopener"
		}, "Open"));
		actions.push(this.copyButton(service.url));
		if (service.kind === "WMS" && this.app.addWmsLayer) this.openWms(record, service, area, countEl);
		else if (service.kind === "WFS" && this.app.addGeoJsonLayer) this.openWfs(record, service, area, countEl);
		else if (service.kind === "ArcGIS REST" && (this.app.addTileLayer || this.app.addGeoJsonLayer)) this.openArcgis(record, service, area, countEl);
		return h("li", { className: "ordt-service" }, h("div", { className: "ordt-row ordt-service-head" }, h("span", { className: "ordt-badge ordt-badge-service" }, service.kind), countEl, h("span", {
			className: "ordt-host",
			title: service.url
		}, host(service.url)), h("span", { className: "ordt-row ordt-small ordt-service-actions" }, ...actions)), service.derivedFrom && h("p", { className: "ordt-note" }, `Not declared in the record: the ${service.kind === "WMS" ? "WMS" : "REST endpoint"} of the same ArcGIS service as its WMTS, which GeoLibre plugins cannot add.`), area);
	}
	note(area, message, kind = "info", report) {
		if (message.includes("but a web page cannot read it: the server sends no CORS headers. The service works in GeoLibre Desktop")) report = void 0;
		if (report) this.logError(report.record, report.service, message);
		area.replaceChildren(h("p", {
			className: "ordt-note",
			"data-kind": kind
		}, message), ...report ? [reportControl(report.record, report.service, message)] : []);
	}
	/** Flag the rows of one kind of service whose readable names are the same in the open record. */
	markSameNames() {
		const groups = /* @__PURE__ */ new Map();
		for (const entry of this.detailRows) {
			const key = `${entry.kind}\n${entry.title().trim().toLowerCase()}`;
			groups.set(key, [...groups.get(key) ?? [], entry.row]);
		}
		for (const rows of groups.values()) for (const row of rows) row.classList.toggle("ordt-layer-same-name", rows.length > 1);
	}
	/**
	* True when a WMS layer is in the project: added from this panel, or found
	* there, as in a project saved with the layer and reopened. An ArcGIS layer
	* is in the project as a tile layer: `tileUrl` is the template it was added with.
	*/
	wmsOnMap(getMapUrl, name, tileUrl) {
		const key = `${getMapUrl}|${name}`;
		const id = this.addedWms.get(key) ?? this.projectWms().get(key) ?? (tileUrl ? this.projectWms().get(tileUrl) : void 0);
		return !!id && (this.app.getLayers?.() ?? []).includes(id);
	}
	/**
	* The project's WMS layers ("GetMap URL|layer" → layer id) and tile layers
	* (tile template → layer id), read once per turn of the event loop.
	*/
	projectWms() {
		if (!this.projectWmsCache) {
			const found = /* @__PURE__ */ new Map();
			let layers = [];
			try {
				layers = this.app.getProjectSnapshot?.().layers ?? [];
			} catch {}
			for (const layer of layers) {
				if (typeof layer?.id !== "string") continue;
				const { url, layers: names, tiles } = layer.source ?? {};
				if (layer.type === "wms" && typeof url === "string" && typeof names === "string") for (const name of names.split(",")) found.set(`${url}|${name}`, layer.id);
				else if (layer.type === "xyz" && Array.isArray(tiles) && typeof tiles[0] === "string") found.set(tiles[0], layer.id);
			}
			this.projectWmsCache = found;
			setTimeout(() => this.projectWmsCache = null, 0);
		}
		return this.projectWmsCache;
	}
	/**
	* Layer list for a WMS/WFS (#7): one row per layer, its readable name on
	* top (the capabilities title if it reads as a name, else a title from RNDT)
	* and the code below. Several rows can be checked for a WMS, one for a WFS
	* (each WFS add is a download of its own). RNDT titles are looked up in the
	* background and replace the labels in place; the per-layer lookups wait
	* for the first pointer or focus on the list, as they waited for the old
	* menu to open. Above FILTER_THRESHOLD layers a filter field narrows the
	* rows; hidden rows keep their tick.
	*/
	layerList(layers, wanted, serviceUrl, mode, ariaLabel, kind, disabledReason = () => null, noteOf = () => null, plainReason = () => false) {
		const shownTitle = (l) => readableTitle(l.name, l.title) ?? (/^\d+$/.test(l.name) && l.title.trim() ? l.title.trim() : null);
		const readable = new Map(layers.map((l) => [l.name, shownTitle(l)]));
		const enabled = layers.filter((l) => !disabledReason(l.name));
		const first = enabled.some((l) => l.name === wanted) ? wanted : enabled.length === 1 ? enabled[0].name : null;
		const group = `ordt-layers-${++this.layerListSeq}`;
		const rows = /* @__PURE__ */ new Map();
		for (const layer of layers) {
			const reason = disabledReason(layer.name);
			const name = readable.get(layer.name);
			const input = h("input", {
				type: mode === "multi" ? "checkbox" : "radio",
				name: group,
				value: layer.name,
				disabled: !!reason,
				checked: layer.name === first
			});
			const title = h("span", { className: "ordt-layer-title" }, name || layer.name);
			const code = h("span", {
				className: "ordt-layer-code",
				hidden: !name
			}, layer.name);
			const row = h("label", {
				className: "ordt-layer",
				title: reason ?? ""
			}, input, h("span", { className: "ordt-layer-text" }, title, code, reason && h("span", { className: plainReason(layer.name) ? "ordt-layer-note" : "ordt-layer-reason" }, reason), !reason && noteOf(layer.name) && h("span", { className: "ordt-layer-note" }, noteOf(layer.name))));
			rows.set(layer.name, {
				row,
				input,
				title,
				code
			});
			this.detailRows.push({
				kind,
				code: layer.name,
				title: () => readable.get(layer.name) || layer.name,
				row
			});
		}
		this.markSameNames();
		const list = h("div", {
			className: "ordt-layers",
			role: mode === "single" ? "radiogroup" : "group",
			"aria-label": ariaLabel
		}, ...Array.from(rows.values(), (r) => r.row));
		const controls = [];
		let folded = layers.length > FOLD_THRESHOLD;
		let filter = null;
		if (folded) {
			for (const r of rows.values()) r.row.hidden = !r.input.checked;
			list.hidden = !Array.from(rows.values()).some((r) => r.input.checked);
			const show = h("button", {
				className: "ordt-link ordt-show-layers",
				type: "button"
			}, `Show all ${layers.length.toLocaleString("en")} layers${list.hidden ? " to choose from" : ""}`);
			show.addEventListener("click", () => {
				folded = false;
				show.remove();
				list.hidden = false;
				for (const r of rows.values()) r.row.hidden = false;
				if (filter) {
					filter.hidden = false;
					filter.dispatchEvent(new Event("input"));
				}
				list.dispatchEvent(new Event("pointerenter"));
				const box = list.parentElement;
				box?.classList.add("ordt-layers-open");
				box?.scrollIntoView?.({ block: "nearest" });
			});
			controls.push(show);
		}
		if (layers.length > FILTER_THRESHOLD) {
			const field = h("input", {
				className: "ordt-input",
				type: "search",
				placeholder: `Filter ${layers.length.toLocaleString("en")} layers…`,
				"aria-label": "Filter layers",
				hidden: folded
			});
			filter = field;
			field.addEventListener("input", () => {
				if (folded) return;
				const needle = field.value.trim().toLowerCase();
				let firstMatch = null;
				for (const [name, r] of rows) {
					const match = !needle || r.title.textContent.toLowerCase().includes(needle) || name.toLowerCase().includes(needle);
					r.row.hidden = !match;
					if (match && !firstMatch && !r.input.disabled) firstMatch = r.input;
				}
				if (mode === "single" && firstMatch && !Array.from(rows.values()).some((r) => r.input.checked && !r.row.hidden)) {
					firstMatch.checked = true;
					list.dispatchEvent(new Event("change"));
				}
			});
			controls.push(field);
		}
		const wantsTitle = (name) => {
			const title = readable.get(name);
			return !title || isDamagedTitle(title);
		};
		const setTitle = (name, title) => {
			if (!improvesTitle(name, readable.get(name), title)) return false;
			readable.set(name, title);
			const r = rows.get(name);
			r.title.textContent = title;
			r.code.hidden = false;
			this.markSameNames();
			return true;
		};
		if (layers.some((l) => wantsTitle(l.name))) {
			const status = h("p", {
				className: "ordt-note",
				"data-kind": "busy"
			}, "Looking up readable names in RNDT…");
			controls.push(status);
			lookupLayerTitles(this.app, RNDT_BASE_URL, serviceUrl).then((lookup) => {
				if (lookup.mode === "all") {
					let found = 0;
					for (const name of rows.keys()) {
						if (!wantsTitle(name)) continue;
						const title = findTitle(lookup.found, name);
						if (title && setTitle(name, title)) found++;
					}
					const report = () => {
						status.hidden = found === 0;
						status.dataset.kind = "info";
						status.textContent = `Readable names from RNDT for ${found.toLocaleString("en")} of ${layers.length.toLocaleString("en")} layers.`;
					};
					report();
					const missing = Array.from(rows.keys()).filter(wantsTitle);
					if (!missing.length) return;
					const onReach = () => {
						if (folded) return;
						list.removeEventListener("pointerenter", onReach);
						list.removeEventListener("focusin", onReach);
						status.hidden = false;
						status.dataset.kind = "busy";
						status.textContent = `Looking up readable names in RNDT for ${missing.length.toLocaleString("en")} layers…`;
						const worker = async () => {
							for (let name = missing.shift(); name; name = missing.shift()) {
								const title = await lookupLayerTitleByCode(this.app, RNDT_BASE_URL, serviceUrl, name);
								if (title && setTitle(name, title)) found++;
							}
						};
						Promise.all(Array.from({ length: 4 }, worker)).then(report);
					};
					list.addEventListener("pointerenter", onReach);
					list.addEventListener("focusin", onReach);
					return;
				}
				const asked = /* @__PURE__ */ new Set();
				let running = 0;
				const lookupTicked = async () => {
					const todo = Array.from(rows).filter(([name, r]) => r.input.checked && wantsTitle(name) && !asked.has(name));
					if (todo.length) {
						running++;
						status.dataset.kind = "busy";
						status.textContent = "Looking up the readable name of the selected layer in RNDT…";
						for (const [name] of todo) {
							asked.add(name);
							const title = await lookupOneLayerTitle(this.app, "https://geodati.gov.it/RNDT", serviceUrl, name) ?? await lookupLayerTitleByCode(this.app, "https://geodati.gov.it/RNDT", serviceUrl, name);
							if (title) setTitle(name, title);
						}
						running--;
					}
					if (running) return;
					status.dataset.kind = "info";
					status.textContent = "Readable names are looked up in RNDT for the selected layer only.";
				};
				list.addEventListener("change", () => void lookupTicked());
				lookupTicked();
			});
		}
		return {
			list,
			controls,
			selected: () => Array.from(rows).filter(([, r]) => r.input.checked && !r.input.disabled).map(([name]) => name),
			nameOf: (name) => {
				const title = readable.get(name) || name;
				return title !== name && rows.get(name).row.classList.contains("ordt-layer-same-name") ? `${title} (${name})` : title;
			},
			setOnMap: (name, on) => {
				const r = rows.get(name);
				r.row.classList.toggle("ordt-layer-on-map", on);
				r.row.querySelector(".ordt-layer-tag")?.remove();
				if (on) r.title.after(h("span", { className: "ordt-layer-tag" }, "on the map"));
			}
		};
	}
	async openWms(record, service, area, countEl) {
		this.note(area, "Reading the WMS capabilities…", "busy");
		try {
			const fetched = await fetchTextFrom(this.app, capabilitiesUrl(service.url, "WMS"));
			const caps = parseWmsCapabilities(fetched.text, fetched.url);
			const endpoint = await reachableEndpoint(this.app, caps.getMapUrl, fetched.url, serviceBaseUrl);
			const declared = endpoint.url;
			caps.getMapUrl = upgradeToHttps(declared, fetched.url);
			if (caps.getMapUrl !== declared && /^http:/i.test(service.url) && await browserNeedsHttp(fetched.url)) caps.getMapUrl = declared;
			if (!caps.layers.length) {
				if (service.derivedFrom) this.note(area, "This ArcGIS service has no WMS layers.", "info");
				else this.note(area, "The WMS lists no named layers.", "error", {
					record,
					service
				});
				return;
			}
			countEl.textContent = layerCount(caps.layers.length);
			const byName = new Map(caps.layers.map((l) => [l.name, l]));
			const undeclared = caps.layers.filter((l) => !supportsWebMercator(l));
			let serverDraws3857 = false;
			if (undeclared.length) {
				this.note(area, "Checking whether the server draws EPSG:3857…", "busy");
				const sample = undeclared.find((l) => !l.group && l.bbox) ?? undeclared.find((l) => l.bbox) ?? undeclared[0];
				serverDraws3857 = await testTile(this.app, probeGetMapUrl(caps.getMapUrl, caps.version, sample.name, sample.bbox ?? record.bbox), 64) === "tile";
			}
			const hostTakesCrs = this.app.importLayerStyle !== void 0;
			const crsOf = (layer) => supportsWebMercator(layer) || serverDraws3857 ? "EPSG:3857" : hostTakesCrs ? pickWmsCrs(layer, caps.version) : null;
			const fixedPicture = /* @__PURE__ */ new Set();
			await Promise.all(caps.layers.filter((l) => l.group).slice(0, MAX_GROUP_TESTS).map(async (l) => {
				const crs = crsOf(l);
				if (!crs || crs !== "EPSG:3857" && !GEOGRAPHIC_CRS.includes(crs)) return;
				const url = probeGetMapUrl(caps.getMapUrl, caps.version, l.name, l.bbox ?? record.bbox, crs);
				if (await testTile(this.app, url, 64) === "other-size") fixedPicture.add(l.name);
			}));
			const outside3857 = (name) => {
				const layer = byName.get(name);
				if (fixedPicture.has(name)) return "A group of the layers below: the server gives one fixed picture for it, whatever the area asked. Tick its layers instead.";
				return crsOf(layer) ? null : `Not offered in EPSG:3857 (only ${layer.crs.slice(0, 6).join(", ")}${layer.crs.length > 6 ? ", …" : ""}), and the server did not draw a test tile in it: ${hostTakesCrs ? "GeoLibre cannot display it." : "it needs GeoLibre 3.2.0 or later."}`;
			};
			const drawnAnyway = (name) => {
				const layer = byName.get(name);
				if (supportsWebMercator(layer)) return null;
				return serverDraws3857 ? "EPSG:3857 not declared, but the server drew a test tile in it." : `Not offered in EPSG:3857: asked in ${crsOf(layer)} and redrawn by GeoLibre.`;
			};
			const wanted = wantedLayer(record, service, caps.layers);
			const { list, controls, selected, nameOf, setOnMap } = this.layerList(caps.layers, wanted, service.url, "multi", "WMS layers", "WMS", outside3857, drawnAnyway, (name) => fixedPicture.has(name));
			const add = h("button", {
				className: "ordt-button ordt-primary",
				type: "button"
			});
			const result = h("p", {
				className: "ordt-note",
				hidden: true
			});
			const sync = () => {
				const count = selected().length;
				add.disabled = count === 0;
				add.textContent = count ? `Add to map (${count})` : "Select a layer";
			};
			if (controls.some((c) => c.tagName === "INPUT")) add.title = "Ticked layers hidden by the filter are added too";
			list.addEventListener("change", sync);
			add.addEventListener("click", () => {
				const already = selected().filter((name) => this.wmsOnMap(caps.getMapUrl, name));
				const names = selected().filter((name) => !already.includes(name));
				const failed = [];
				for (const name of names) {
					const layer = byName.get(name);
					try {
						const id = this.app.addWmsLayer(nameOf(name), {
							url: caps.getMapUrl,
							layers: name,
							version: caps.version.startsWith("1.3") ? "1.3.0" : "1.1.1",
							format: "image/png",
							transparent: true,
							bounds: wmsLayerBounds(layer.bbox, record.bbox, record.type),
							...crsOf(layer) !== "EPSG:3857" && { crs: crsOf(layer) }
						});
						this.addedWms.set(`${caps.getMapUrl}|${name}`, id);
						setOnMap(name, true);
					} catch (error) {
						failed.push(`${nameOf(name)}: ${errorMessage(error)}`);
					}
				}
				const added = names.length - failed.length;
				result.hidden = false;
				result.dataset.kind = failed.length ? "error" : "info";
				result.textContent = [
					names.length > 0 && `Added ${added} of ${names.length} ${names.length === 1 ? "layer" : "layers"}, named with their titles.`,
					already.length > 0 && `Already on the map, not added again: ${already.map(nameOf).join("; ")}. Remove ${already.length === 1 ? "it" : "them"} from Layers to add ${already.length === 1 ? "it" : "them"} again.`,
					...failed.map((f) => `Could not add ${f}`)
				].filter(Boolean).join(" ");
			});
			for (const name of caps.layers.map((l) => l.name)) if (this.wmsOnMap(caps.getMapUrl, name)) setOnMap(name, true);
			const note = enabledCount(caps.layers, outside3857) === 0 ? h("p", {
				className: "ordt-note",
				"data-kind": "error"
			}, `No layer of this WMS is offered in EPSG:3857: ${hostTakesCrs ? "GeoLibre cannot display them" : "they need GeoLibre 3.2.0 or later"}.`) : null;
			area.replaceChildren(...controls.filter((c) => c.tagName === "INPUT"), list, ...controls.filter((c) => c.tagName !== "INPUT"), ...note ? [note] : [], ...endpoint.note ? [h("p", { className: "ordt-note" }, endpoint.note)] : [], h("div", { className: "ordt-row ordt-small ordt-add-row" }, add, h("span", { className: "ordt-muted" }, "added with their titles as layer names")), result);
			showTicked(list);
			sync();
		} catch (error) {
			if (service.derivedFrom) this.note(area, "This ArcGIS service offers no WMS.", "info");
			else this.note(area, `WMS error: ${errorMessage(error)}`, "error", {
				record,
				service
			});
		}
	}
	async openWfs(record, service, area, countEl) {
		this.note(area, "Reading the WFS capabilities…", "busy");
		try {
			const fetched = await fetchTextFrom(this.app, capabilitiesUrl(service.url, "WFS"));
			const caps = parseWfsCapabilities(fetched.text, fetched.url);
			const endpoint = await reachableEndpoint(this.app, caps.getFeatureUrl, fetched.url, serviceBaseUrl);
			caps.getFeatureUrl = upgradeToHttps(endpoint.url, fetched.url);
			if (!caps.featureTypes.length) {
				this.note(area, "The WFS lists no feature types.", "error", {
					record,
					service
				});
				return;
			}
			const format = pickJsonFormat(caps.outputFormats);
			if (!format) {
				this.note(area, "This WFS offers no GeoJSON output, so the plugin cannot add it. GeoLibre's Add Data > WFS Layer can read GML services: Copy URL above and try it there.", "error");
				return;
			}
			countEl.textContent = layerCount(caps.featureTypes.length);
			const wanted = wantedLayer(record, service, caps.featureTypes);
			const { list, controls, selected, nameOf } = this.layerList(caps.featureTypes, wanted, service.url, "single", "WFS feature types", "WFS");
			const inView = h("input", {
				type: "checkbox",
				checked: true
			});
			const add = h("button", {
				className: "ordt-button ordt-primary",
				type: "button"
			}, "Add features");
			const syncAdd = () => {
				add.disabled = selected().length === 0;
				add.title = add.disabled ? "Pick a feature type first" : "";
			};
			list.addEventListener("change", syncAdd);
			const result = h("p", {
				className: "ordt-note",
				hidden: true
			});
			add.addEventListener("click", () => {
				(async () => {
					const name = selected()[0];
					if (!name) return;
					const view = inView.checked ? this.app.getViewBounds?.() ?? null : null;
					const bbox = view ? clampBbox(view) : null;
					add.disabled = true;
					result.hidden = false;
					result.dataset.kind = "busy";
					result.textContent = "Counting features…";
					try {
						const total = await this.countFeatures(caps, name, bbox);
						let limit = WFS_MAX_FEATURES;
						if (total !== null && total > 1e4) {
							const choice = await askChoice(result, `${total.toLocaleString("en")} features in this area. Downloading them all can be slow and use a lot of memory.`, [
								{
									value: "all",
									label: "Download all"
								},
								{
									value: "first",
									label: `First ${WFS_MAX_FEATURES.toLocaleString("en")} only`
								},
								{
									value: "cancel",
									label: "Cancel"
								}
							]);
							if (choice === "cancel") {
								result.dataset.kind = "info";
								result.textContent = "Download cancelled.";
								return;
							}
							if (choice === "all") limit = total;
						}
						result.dataset.kind = "busy";
						result.textContent = "Downloading features…";
						const url = buildGetFeatureUrl(caps, name, {
							format,
							maxFeatures: limit,
							bbox
						});
						const data = await fetchJson(this.app, url, { download: true });
						if (!isFeatureCollection(data)) throw new Error("the response is not a GeoJSON FeatureCollection");
						if (!data.features.length) {
							result.dataset.kind = "info";
							result.textContent = inView.checked ? "No features in the current map view." : "The service returned no features.";
							return;
						}
						const wgs84 = toWgs84(data);
						const layerId = this.app.addGeoJsonLayer(nameOf(name) || record.title, fixAxisOrder(wgs84.fc));
						const styled = await this.applyServerStyle(layerId, getStylesUrl(caps.getFeatureUrl, name));
						result.dataset.kind = "info";
						const added = data.features.length;
						result.textContent = (total !== null && added < total ? `Added ${added.toLocaleString("en")} of ${total.toLocaleString("en")} features: the map is incomplete, zoom in for the rest.` : total === null && added >= limit ? `Added ${added.toLocaleString("en")} features: limit reached, the map may be incomplete; zoom in for the rest.` : `Added ${added.toLocaleString("en")} features.`) + styled;
					} catch (error) {
						result.dataset.kind = "error";
						const message = errorMessage(error);
						result.textContent = message.startsWith("cannot reach") ? `WFS error: ${message}. Large layers can be slow: zoom in and keep "Only features in the current map view" checked.` : `WFS error: ${message}`;
						if (!message.includes("but a web page cannot read it: the server sends no CORS headers. The service works in GeoLibre Desktop")) {
							result.append(" ", reportControl(record, service, `WFS error: ${message}`));
							this.logError(record, service, `WFS error: ${message}`);
						}
					} finally {
						syncAdd();
					}
				})();
			});
			area.replaceChildren(...controls.filter((c) => c.tagName === "INPUT"), list, ...controls.filter((c) => c.tagName !== "INPUT"), h("label", { className: "ordt-check ordt-small" }, inView, "Only features in the current map view"), ...endpoint.note ? [h("p", { className: "ordt-note" }, endpoint.note)] : [], h("div", { className: "ordt-row ordt-small ordt-add-row" }, add), result);
			showTicked(list);
			syncAdd();
		} catch (error) {
			this.note(area, `WFS error: ${errorMessage(error)}`, "error", {
				record,
				service
			});
		}
	}
	/**
	* Dresses a layer of downloaded features with the SLD its server draws them
	* with (GeoLibre 3.2.0). Returns the words to add to the result, empty when
	* the host cannot, the server gives no SLD or the style does not fit: the
	* layer then keeps GeoLibre's default style, which is no fault to report.
	*/
	async applyServerStyle(layerId, url) {
		if (!this.app.importLayerStyle) return "";
		try {
			const text = await fetchText(this.app, url);
			if (!text.includes("StyledLayerDescriptor")) return "";
			const outcome = this.app.importLayerStyle(layerId, text);
			if (!outcome.ok) return "";
			const skipped = outcome.warnings.length;
			return skipped ? ` Drawn with the server's style, except ${skipped} ${skipped === 1 ? "part" : "parts"} GeoLibre cannot show.` : " Drawn with the server's style.";
		} catch {
			return "";
		}
	}
	/**
	* An ArcGIS REST service: its layers as images, through a tile layer on its
	* `export` request (GeoLibre's own ArcGIS layers do the same), and one
	* layer's features as GeoJSON from its `query`, page by page.
	*/
	async openArcgis(record, service, area, countEl) {
		const parsed = parseArcgisUrl(service.url);
		this.note(area, "Reading the ArcGIS service…", "busy");
		try {
			const fetched = await fetchTextFrom(this.app, `${parsed.serviceUrl}?f=json`);
			let json;
			try {
				json = JSON.parse(fetched.text);
			} catch {
				throw new Error("the service description is not JSON");
			}
			const arcgis = {
				...parsed,
				serviceUrl: fetched.url.replace(/\?.*$/, "")
			};
			const info = parseArcgisService(json, arcgis.type);
			const image = arcgis.type === "ImageServer";
			const layers = image ? [{
				name: "0",
				title: String(json.name ?? "").split("/").pop() || record.title,
				minScale: 0,
				maxScale: 0,
				hasFeatures: false
			}] : info.layers;
			if (!layers.length) {
				if (service.derivedFrom) this.note(area, "This ArcGIS service has no layers to add.", "info");
				else this.note(area, "The ArcGIS service lists no layers.", "error", {
					record,
					service
				});
				return;
			}
			const canDraw = info.drawsImage && !!this.app.addTileLayer;
			const canQuery = info.hasGeoJson && !!this.app.addGeoJsonLayer && layers.some((l) => l.hasFeatures);
			if (!canDraw && !canQuery) {
				this.note(area, info.hasQuery ? "This ArcGIS service gives neither images nor GeoJSON features (ArcGIS before 10.4): it cannot be added." : "This ArcGIS service gives neither images nor features: it cannot be added.", "info");
				return;
			}
			countEl.textContent = layerCount(layers.length);
			let drawProblem = null;
			if (canDraw) {
				this.note(area, "Checking that the service draws in GeoLibre…", "busy");
				const probe = arcgisExportUrl(arcgis, null, probeBbox3857(record.bbox), 64);
				if (!await browserGetsImage(probe)) drawProblem = await answersWithImage(this.app, probe) ? "The server draws the map, but does not let GeoLibre show it (no CORS header in its answer)." : "The server did not draw a test image in EPSG:3857.";
			}
			const byName = new Map(layers.map((l) => [l.name, l]));
			const wanted = image ? "0" : wantedLayer(record, service, layers);
			const { list, controls, selected, nameOf, setOnMap } = this.layerList(layers, wanted, service.url, "multi", "ArcGIS layers", ARCGIS_KIND, () => null, (name) => scaleNote(byName.get(name)));
			const add = h("button", {
				className: "ordt-button ordt-primary",
				type: "button"
			});
			/** The tile template a layer is added with, also what a saved project keeps of it. */
			const tileUrl = (name) => arcgisExportUrl(arcgis, image ? null : name, "{bbox-epsg-3857}", 256);
			const addFeatures = h("button", {
				className: "ordt-button",
				type: "button"
			}, "Add features");
			const inView = h("input", {
				type: "checkbox",
				checked: true
			});
			const result = h("p", {
				className: "ordt-note",
				hidden: true
			});
			const sync = () => {
				const count = selected().length;
				add.disabled = !!drawProblem || count === 0;
				add.textContent = count ? `Add to map (${count})` : "Select a layer";
				const one = count === 1 ? byName.get(selected()[0]) : null;
				addFeatures.disabled = !one?.hasFeatures;
				addFeatures.title = !one ? "Tick one layer: its features are downloaded" : one.hasFeatures ? "" : "A raster layer: it has no features to download";
			};
			list.addEventListener("change", sync);
			add.addEventListener("click", () => {
				const already = selected().filter((name) => this.wmsOnMap(arcgis.serviceUrl, name, tileUrl(name)));
				const names = selected().filter((name) => !already.includes(name));
				const failed = [];
				for (const name of names) try {
					const id = this.app.addTileLayer(nameOf(name), tileUrl(name), { attribution: info.copyright || void 0 });
					this.addedWms.set(`${arcgis.serviceUrl}|${name}`, id);
					setOnMap(name, true);
				} catch (error) {
					failed.push(`${nameOf(name)}: ${errorMessage(error)}`);
				}
				const added = names.length - failed.length;
				result.hidden = false;
				result.dataset.kind = failed.length ? "error" : "info";
				result.textContent = [
					names.length > 0 && `Added ${added} of ${names.length} ${names.length === 1 ? "layer" : "layers"}, named with their titles.`,
					already.length > 0 && `Already on the map, not added again: ${already.map(nameOf).join("; ")}. Remove ${already.length === 1 ? "it" : "them"} from Layers to add ${already.length === 1 ? "it" : "them"} again.`,
					...failed.map((f) => `Could not add ${f}`)
				].filter(Boolean).join(" ");
			});
			addFeatures.addEventListener("click", () => {
				(async () => {
					const name = selected()[0];
					if (selected().length !== 1) return;
					const view = inView.checked ? this.app.getViewBounds?.() ?? null : null;
					const bbox = view ? clampBbox(view) : null;
					addFeatures.disabled = true;
					result.hidden = false;
					result.dataset.kind = "busy";
					result.textContent = "Counting features…";
					try {
						await this.addArcgisFeatures(arcgis, name, nameOf(name), bbox, result);
					} catch (error) {
						const message = `ArcGIS error: ${errorMessage(error)}`;
						result.dataset.kind = "error";
						result.textContent = message;
						if (!message.includes("but a web page cannot read it: the server sends no CORS headers. The service works in GeoLibre Desktop")) {
							result.append(" ", reportControl(record, service, message));
							this.logError(record, service, message);
						}
					} finally {
						sync();
					}
				})();
			});
			for (const name of layers.map((l) => l.name)) if (this.wmsOnMap(arcgis.serviceUrl, name, tileUrl(name))) setOnMap(name, true);
			const drawRow = canDraw ? [...drawProblem ? [h("p", {
				className: "ordt-note",
				"data-kind": "error"
			}, drawProblem)] : [], h("div", { className: "ordt-row ordt-small ordt-add-row" }, add, h("span", { className: "ordt-muted" }, "added as images, with their titles as layer names"))] : [h("p", { className: "ordt-note" }, "This service gives no images, only features.")];
			const featureRow = canQuery ? [h("label", { className: "ordt-check ordt-small" }, inView, "Only features in the current map view"), h("div", { className: "ordt-row ordt-small" }, addFeatures, h("span", { className: "ordt-muted" }, "of the one ticked layer"))] : !image && info.hasQuery ? [h("p", { className: "ordt-note" }, "Features cannot be downloaded: the service gives no GeoJSON (ArcGIS before 10.4).")] : [];
			area.replaceChildren(...controls.filter((c) => c.tagName === "INPUT"), list, ...controls.filter((c) => c.tagName !== "INPUT"), ...drawRow, ...featureRow, result);
			showTicked(list);
			sync();
		} catch (error) {
			if (service.derivedFrom) this.note(area, `The ArcGIS REST endpoint of this WMTS cannot be read: ${errorMessage(error)}.`, "info");
			else this.note(area, `ArcGIS error: ${errorMessage(error)}`, "error", {
				record,
				service
			});
		}
	}
	/**
	* Download one ArcGIS layer's features as GeoJSON, page by page (servers
	* return at most `maxRecordCount` features a request, often 1,000), asking
	* first above WFS_MAX_FEATURES as for a WFS.
	*/
	async addArcgisFeatures(arcgis, layerId, layerName, bbox, result) {
		const layerUrl = `${arcgis.serviceUrl}/${layerId}`;
		const layer = parseArcgisLayer(await fetchJson(this.app, `${layerUrl}?f=json`));
		let total = null;
		try {
			total = parseArcgisCount(await fetchJson(this.app, arcgisQueryUrl(layerUrl, {
				bbox,
				count: true
			})));
		} catch {}
		if (total === 0) {
			result.dataset.kind = "info";
			result.textContent = bbox ? "No features in the current map view." : "The service returned no features.";
			return;
		}
		let limit = WFS_MAX_FEATURES;
		if (total !== null && total > 1e4) {
			const choice = await askChoice(result, `${total.toLocaleString("en")} features in this area. Downloading them all can be slow and use a lot of memory.`, [
				{
					value: "all",
					label: "Download all"
				},
				{
					value: "first",
					label: `First ${WFS_MAX_FEATURES.toLocaleString("en")} only`
				},
				{
					value: "cancel",
					label: "Cancel"
				}
			]);
			if (choice === "cancel") {
				result.dataset.kind = "info";
				result.textContent = "Download cancelled.";
				return;
			}
			if (choice === "all") limit = total;
		}
		const target = Math.min(limit, total ?? limit);
		const features = [];
		let partial = false;
		for (let page = 0; features.length < target; page++) {
			result.dataset.kind = "busy";
			result.textContent = `Downloading features… ${features.length.toLocaleString("en")}${total !== null ? ` of ${target.toLocaleString("en")}` : ""}`;
			const want = Math.min(layer.pageSize, target - features.length);
			const url = arcgisQueryUrl(layerUrl, layer.paginates ? {
				bbox,
				offset: features.length,
				limit: want
			} : { bbox });
			const data = await fetchJson(this.app, url, { download: true });
			if (!isFeatureCollection(data)) {
				throwArcgisError(data);
				throw new Error("the response is not a GeoJSON FeatureCollection");
			}
			features.push(...data.features.slice(0, target - features.length));
			if (!layer.paginates) {
				partial = total !== null ? features.length < total : data.features.length >= layer.pageSize;
				break;
			}
			if (data.features.length < want || page > 1e3) break;
		}
		if (!features.length) {
			result.dataset.kind = "info";
			result.textContent = bbox ? "No features in the current map view." : "The service returned no features.";
			return;
		}
		this.app.addGeoJsonLayer(layerName, {
			type: "FeatureCollection",
			features
		});
		const added = features.length;
		result.dataset.kind = "info";
		result.textContent = total !== null && added < total ? `Added ${added.toLocaleString("en")} of ${total.toLocaleString("en")} features: the map is incomplete${partial ? ", the server gives one page only" : ""}; zoom in for the rest.` : partial ? `Added ${added.toLocaleString("en")} features: the server gives one page only, the map may be incomplete; zoom in for the rest.` : `Added ${added.toLocaleString("en")} features.`;
	}
	/** How many features a download would match, or null when the server cannot tell. */
	async countFeatures(caps, typeName, bbox) {
		const url = buildHitsUrl(caps, typeName, bbox);
		if (!url) return null;
		try {
			return parseHitsCount(await fetchText(this.app, url));
		} catch {
			return null;
		}
	}
	async addGeoJson(record, service, area) {
		this.note(area, "Downloading GeoJSON…", "busy");
		try {
			const data = await fetchJson(this.app, service.url, { download: true });
			if (!isFeatureCollection(data)) throw new Error("the file is not a GeoJSON FeatureCollection");
			const wgs84 = toWgs84(data);
			this.app.addGeoJsonLayer(record.title, fixAxisOrder(wgs84.fc));
			this.note(area, `Added ${data.features.length} features${wgs84.from ? `, converted from EPSG:${wgs84.from}` : ""}.`);
		} catch (error) {
			this.note(area, `Could not add the file: ${errorMessage(error)}`, "error", {
				record,
				service
			});
		}
	}
};
//#endregion
//#region src/geolibre.ts
var disposePanel = null;
/** The active panel, and the map move that waits for it to open. */
var activePanel = null;
var fitWhenSettled = null;
/** The search of a project, given before the plugin is turned on. */
var savedState = null;
/** The link already followed: GeoLibre gives its parameters again at every project it opens. */
var followedLink = null;
var plugin = {
	id: PLUGIN_ID,
	name: PLUGIN_NAME,
	version: PLUGIN_VERSION,
	engines: ["maplibre"],
	urlParameterNames: URL_PARAMETER_NAMES,
	restoresPanelCollapseState: true,
	clearsStateOnProjectLoad: true,
	activate(app) {
		const host = app;
		if (!host.registerRightPanel) return false;
		const panel = new RndtPanel(host);
		const registration = {
			id: PANEL_ID,
			title: PLUGIN_LABEL,
			defaultWidth: 380,
			deactivatePluginOnClose: true,
			render: (container) => panel.mount(container)
		};
		const unregister = host.registerRightPanel(registration);
		const unregisterMenu = host.registerToolbarMenu?.({
			id: `${PLUGIN_ID}-menu`,
			label: PLUGIN_LABEL,
			items: [
				{
					id: "open",
					label: "Open search panel",
					onSelect: () => host.openRightPanel?.(PANEL_ID)
				},
				{
					id: "footprints",
					label: "Hide or show footprints",
					onSelect: () => panel.toggleFootprints()
				},
				{
					id: "clear",
					label: "Clear results and footprints",
					onSelect: () => panel.clearResults()
				}
			]
		});
		host.openRightPanel?.(PANEL_ID);
		const view = host.getViewBounds?.();
		const [west, south, east, north] = ITALY_BBOX;
		const onItaly = view && view[2] - view[0] < 45 && (view[0] + view[2]) / 2 >= west && (view[0] + view[2]) / 2 <= east && (view[1] + view[3]) / 2 >= south && (view[1] + view[3]) / 2 <= north;
		let cancelMove = () => {};
		const fit = (bbox) => {
			cancelMove();
			const map = host.getMap?.();
			const move = () => {
				cancelMove();
				host.fitBounds?.(bbox);
			};
			let timer = setTimeout(move, 600);
			const onResize = () => {
				clearTimeout(timer);
				timer = setTimeout(move, 150);
			};
			map?.on("resize", onResize);
			cancelMove = () => {
				clearTimeout(timer);
				map?.off("resize", onResize);
			};
		};
		if (view && !onItaly) fit(ITALY_BBOX);
		activePanel = panel;
		fitWhenSettled = fit;
		if (savedState) panel.restore(savedState);
		savedState = null;
		disposePanel = () => {
			cancelMove();
			unregisterMenu?.();
			host.closeRightPanel?.(PANEL_ID);
			unregister();
			panel.destroy();
			activePanel = null;
			fitWhenSettled = null;
		};
	},
	handleUrlParameters(_app, params) {
		const link = linkSearchFrom(params);
		if (!link || !activePanel) return;
		const key = JSON.stringify(link);
		if (key === followedLink) return;
		followedLink = key;
		if (link.form.bbox) fitWhenSettled?.(link.form.bbox);
		activePanel.searchFromLink(link);
	},
	getProjectState() {
		return (activePanel ? activePanel.projectState() : savedState) ?? void 0;
	},
	applyProjectState(_app, state) {
		if (state === void 0) {
			savedState = null;
			activePanel?.reset();
			return;
		}
		const parsed = parsePanelState(state);
		if (!parsed) return false;
		if (activePanel) activePanel.restore(parsed);
		else savedState = parsed;
	},
	deactivate() {
		disposePanel?.();
		disposePanel = null;
	}
};
//#endregion
export { plugin as default, plugin };
