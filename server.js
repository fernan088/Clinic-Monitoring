const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));  

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB (BSON) connected'))
  .catch(err => console.error('❌ DB Error:', err));

const logbookSchema = new mongoose.Schema({
  patientName: { type: String, required: true },    
  complaint:   { type: String, required: true },     
  treatment:   { type: String, required: true },      
  status: {
    type: String,
    enum: ['Treated', 'Referred', 'Observing'],
    default: 'Treated'
  },
  dateVisited: { type: Date, default: Date.now }   
});
const Logbook = mongoose.model('Logbook', logbookSchema);

const bedSchema = new mongoose.Schema({
  bedLabel: { type: String, required: true, unique: true }, 
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance'],
    default: 'Available'
  }
});
const Bed = mongoose.model('Bed', bedSchema);

const supplySchema = new mongoose.Schema({
  itemName: { type: String, required: true },         
  quantity: { type: Number, required: true, min: 0 }, 
  category: { type: String, required: true }         
});
const Supply = mongoose.model('Supply', supplySchema);

app.get('/api/logbook', async (req, res) => {
  res.json(await Logbook.find().sort({ dateVisited: -1 }));
});
app.post('/api/logbook', async (req, res) => {
  const entry = await new Logbook(req.body).save();
  res.status(201).json(entry);
});

app.get('/api/beds', async (req, res) => {
  res.json(await Bed.find().sort({ bedLabel: 1 }));
});
app.post('/api/beds', async (req, res) => {
  const bed = await new Bed(req.body).save();
  res.status(201).json(bed);
});

app.get('/api/supplies', async (req, res) => {
  res.json(await Supply.find().sort({ quantity: 1 }));
});
app.post('/api/supplies', async (req, res) => {
  const item = await new Supply(req.body).save();
  res.status(201).json(item);
});

async function seedBeds() {
  const count = await Bed.countDocuments();
  if (count === 0) {
    await Bed.insertMany([
      { bedLabel: 'Bed 1', status: 'Available' },
      { bedLabel: 'Bed 2', status: 'Available' },
      { bedLabel: 'Bed 3', status: 'Available' },
      { bedLabel: 'Bed 4', status: 'Occupied' },
      { bedLabel: 'Bed 5', status: 'Available' }
    ]);
    console.log('🛏️  Seeded 5 default beds');
  }
}
seedBeds();

app.listen(PORT, () => {
  console.log(`🚀 BULSU Clinic Dashboard → http://localhost:${PORT}`);
});