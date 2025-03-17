import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, _res) => {
  _res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
