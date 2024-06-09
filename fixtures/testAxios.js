import axios from "axios";

axios({
  method: 'get',
  url: 'http://localhost:3000/health',
  headers: { 'Content-Type': 'application/json' },
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Request failed:', error);
});