import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.join(__dirname, "../test-access.log");
const NUM_LOGS = 50;

const NORMAL_IPS = ["192.168.1.10", "10.0.0.55", "172.16.0.4", "203.0.113.19", "198.51.100.22"];
const MALICIOUS_IPS = ["104.28.14.3", "45.33.22.11", "185.15.58.20"];

const NORMAL_ENDPOINTS = [
  "GET / HTTP/1.1",
  "GET /about HTTP/1.1",
  "GET /images/logo.png HTTP/1.1",
  "GET /css/styles.css HTTP/1.1",
  "GET /api/v1/status HTTP/1.1",
  "GET /contact HTTP/1.1"
];

const MALICIOUS_ENDPOINTS = [
  "POST /api/users/login?email=admin@aegis.ai&password=' OR 1=1 -- HTTP/1.1",
  "GET /search?q=<script>alert(1)</script> HTTP/1.1",
  "GET /api/files/download?path=../../../etc/passwd HTTP/1.1",
  "POST /api/config?cmd=rm -rf / HTTP/1.1",
  "GET /index.php?id=1 UNION SELECT null, version() HTTP/1.1"
];

const generateRandomLog = (isMalicious: boolean): string => {
  const date = new Date(Date.now() - Math.floor(Math.random() * 10000000));
  const timestamp = date.toISOString().replace("T", " ").substring(0, 19);
  
  const ip = isMalicious 
    ? MALICIOUS_IPS[Math.floor(Math.random() * MALICIOUS_IPS.length)]
    : NORMAL_IPS[Math.floor(Math.random() * NORMAL_IPS.length)];
    
  const request = isMalicious
    ? MALICIOUS_ENDPOINTS[Math.floor(Math.random() * MALICIOUS_ENDPOINTS.length)]
    : NORMAL_ENDPOINTS[Math.floor(Math.random() * NORMAL_ENDPOINTS.length)];
    
  const status = isMalicious ? "403" : "200";
  const size = Math.floor(Math.random() * 5000) + 200;
  
  // Apache Combined Format roughly
  return `${ip} - - [${timestamp}] "${request}" ${status} ${size} "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"`;
};

const generateLogs = () => {
  const logs: string[] = [];
  
  for (let i = 0; i < NUM_LOGS; i++) {
    const isMalicious = Math.random() < 0.2; // 20% chance
    logs.push(generateRandomLog(isMalicious));
  }
  
  fs.writeFileSync(LOG_FILE_PATH, logs.join("\n"));
  console.log(`[SUCCESS] Generated ${NUM_LOGS} log entries in ${LOG_FILE_PATH}`);
};

generateLogs();
