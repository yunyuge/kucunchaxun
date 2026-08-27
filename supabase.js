const SUPABASE_URL = "https://bszucvsimgijzhuvzcnt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YmHVJ0_CYY4UhWyPM5vDYg_p4XqAsRI";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const WAREHOUSES = [
	{ id: 'warehouse-1', name: '龙卷风' },
	{ id: 'warehouse-2', name: '锌时代' }
];
