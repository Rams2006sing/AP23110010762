'use server';
import axios from 'axios';

const LOG_URL = 'http://20.207.122.201/evaluation-service/logs';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzcmlyYW1zYWlfbXV2dmFAc3JtYXAuZWR1LmluIiwiZXhwIjoxNzc3NzAxNTMwLCJpYXQiOjE3Nzc3MDA2MzAsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiIxMGI1YzBiMS02OGY5LTQyZWMtODU5Mi02M2UxMjNlNjk2NDEiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJtdXZ2YSBzcmlyYW0gc2FpIiwic3ViIjoiMDBiZDZlNDEtMDhmOC00NzQyLTliNzAtMzE0MjkxZDI2ZDQxIn0sImVtYWlsIjoic3JpcmFtc2FpX211dnZhQHNybWFwLmVkdS5pbiIsIm5hbWUiOiJtdXZ2YSBzcmlyYW0gc2FpIiwicm9sbE5vIjoiYXAyMzExMDAxMDc2MiIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6IjAwYmQ2ZTQxLTA4ZjgtNDc0Mi05YjcwLTMxNDI5MWQyNmQ0MSIsImNsaWVudFNlY3JldCI6IlpjckdrcmdFUFh6R2hQWGIifQ.EP0c81dYXLSno7IW9YZe6_GMz9LBUZYSKkpqVPlYN-Y';

export async function sendLogToServer(stack, level, pkg, message) {
    try {
        const response = await axios.post(LOG_URL, {
            stack: stack.toLowerCase(),
            level: level.toLowerCase(),
            package: pkg.toLowerCase(),
            message: message,
            timestamp: new Date().toISOString()
        }, {
            headers: { 
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        return { success: true, logID: response.data.logID };
    } catch (error) {
        console.error("Logging failed on server:", error.message);
        return { success: false, error: error.message };
    }
}