export type Pilot = {
	cid: number;
	name: string;
	callsign: string;
	server: string;
	pilot_rating: number;
	military_rating: number;
	latitude: number;
	longitude: number;
	altitude: number;
	groundspeed: number;
	transponder: string;
	heading: number;
	qnh_i_hg: number;
	qnh_mb: number;
	flight_plan: {
		flight_rules: string;
		aircraft: string;
		aircraft_faa: string;
		aircraft_short: string;
		departure: string;
		arrival: string;
		alternate: string;
		cruise_tas: number;
		altitude: number;
		deptime: number;
		enroute_time: number;
		fuel_time: number;
		remarks: string;
		route: string;
		revision_id: number;
		assigned_transponder: string;
	};
	departure_airport: Airport | undefined;
	arrival_airport: Airport | undefined;
	logon_time: string;
	last_updated: string;
};

export type Controller = {
	cid: number;
	name: string;
	callsign: string;
	frequency: string;
	facility: number;
	rating: number;
	server: string;
	visual_range: number;
	text_atis: string[];
	last_updated: string;
	logon_time: string;
	facility_details: {
		id: number;
		short: string;
		long: string;
	}[];
	transceivers: {
		frequency: number;
		latDeg: number;
		lonDeg: number;
	}[];
	airport: Airport | undefined;
};

export type Airport = {
	icao: string;
	iata: string;
	name: string;
	city: string;
	state: string;
	country: string;
	elevation: number;
	lat: number;
	lon: number;
	tz: string;
};

export type Metar = {
	id: string;
	metar: string;
};
