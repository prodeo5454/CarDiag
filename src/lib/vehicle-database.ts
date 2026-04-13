import { VehicleMake } from '@/types';

export const vehicleMakes: VehicleMake[] = [
  {
    name: 'Acura', country: 'Japan',
    models: [
      { name: 'ILX', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022], engines: ['2.4L I4','2.0L I4'], transmissions: ['8-Speed DCT','CVT'] },
      { name: 'TLX', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L V6','2.4L I4'], transmissions: ['10-Speed AT','9-Speed AT'] },
      { name: 'MDX', years: [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6','3.0L V6','3.5L V6 Hybrid'], transmissions: ['10-Speed AT','9-Speed AT','6-Speed AT'] },
      { name: 'RDX', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.5L V6','2.3L Turbo I4'], transmissions: ['10-Speed AT','6-Speed AT'] },
      { name: 'Integra', years: [2023,2024,2025], engines: ['1.5L Turbo I4'], transmissions: ['CVT','6-Speed MT'] },
    ],
  },
  {
    name: 'Alfa Romeo', country: 'Italy',
    models: [
      { name: 'Giulia', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.9L Twin-Turbo V6'], transmissions: ['8-Speed AT'] },
      { name: 'Stelvio', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.9L Twin-Turbo V6'], transmissions: ['8-Speed AT'] },
      { name: 'Tonale', years: [2023,2024,2025], engines: ['1.3L Turbo PHEV','2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
    ],
  },
  {
    name: 'Audi', country: 'Germany',
    models: [
      { name: 'A3', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','1.8L Turbo I4','2.5L Turbo I5'], transmissions: ['7-Speed S tronic','6-Speed S tronic'] },
      { name: 'A4', years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L V6'], transmissions: ['7-Speed S tronic','CVT','6-Speed MT'] },
      { name: 'A6', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L V6','3.0L TDI'], transmissions: ['7-Speed S tronic'] },
      { name: 'Q3', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['8-Speed AT'] },
      { name: 'Q5', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L V6','2.0L PHEV'], transmissions: ['7-Speed S tronic'] },
      { name: 'Q7', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L V6','3.0L TDI','4.0L V8'], transmissions: ['8-Speed AT'] },
      { name: 'Q8', years: [2019,2020,2021,2022,2023,2024], engines: ['3.0L V6','4.0L V8'], transmissions: ['8-Speed AT'] },
      { name: 'e-tron', years: [2019,2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'BMW', country: 'Germany',
    models: [
      { name: '3 Series', years: [2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','2.0L Diesel'], transmissions: ['8-Speed AT','6-Speed MT'] },
      { name: '5 Series', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','4.4L V8'], transmissions: ['8-Speed AT'] },
      { name: '7 Series', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.4L V8','Electric'], transmissions: ['8-Speed AT'] },
      { name: 'X1', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['8-Speed AT','7-Speed DCT'] },
      { name: 'X3', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6'], transmissions: ['8-Speed AT'] },
      { name: 'X5', years: [2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.4L V8','3.0L Diesel'], transmissions: ['8-Speed AT'] },
      { name: 'X7', years: [2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.4L V8'], transmissions: ['8-Speed AT'] },
      { name: 'i4', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'iX', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'M3', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Twin-Turbo I6'], transmissions: ['8-Speed AT','6-Speed MT'] },
      { name: 'M5', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['4.4L Twin-Turbo V8'], transmissions: ['8-Speed AT'] },
    ],
  },
  {
    name: 'Buick', country: 'USA',
    models: [
      { name: 'Enclave', years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6'], transmissions: ['9-Speed AT'] },
      { name: 'Encore', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022], engines: ['1.4L Turbo I4'], transmissions: ['6-Speed AT'] },
      { name: 'Encore GX', years: [2020,2021,2022,2023,2024], engines: ['1.2L Turbo I3','1.3L Turbo I3'], transmissions: ['CVT','9-Speed AT'] },
      { name: 'Envision', years: [2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
    ],
  },
  {
    name: 'Cadillac', country: 'USA',
    models: [
      { name: 'CT4', years: [2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.7L Turbo I4','3.6L V6'], transmissions: ['10-Speed AT'] },
      { name: 'CT5', years: [2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Twin-Turbo V6','6.2L V8'], transmissions: ['10-Speed AT'] },
      { name: 'Escalade', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['6.2L V8','3.0L Diesel I6'], transmissions: ['10-Speed AT'] },
      { name: 'XT4', years: [2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'XT5', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.6L V6'], transmissions: ['9-Speed AT'] },
      { name: 'LYRIQ', years: [2023,2024,2025], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Chevrolet', country: 'USA',
    models: [
      { name: 'Malibu', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L Turbo I4','2.4L I4'], transmissions: ['CVT','6-Speed AT','9-Speed AT'] },
      { name: 'Camaro', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.6L V6','6.2L V8'], transmissions: ['10-Speed AT','6-Speed MT'] },
      { name: 'Corvette', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['6.2L V8','5.5L V8'], transmissions: ['8-Speed DCT','7-Speed MT'] },
      { name: 'Silverado 1500', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.7L Turbo I4','5.3L V8','6.2L V8','3.0L Diesel'], transmissions: ['8-Speed AT','10-Speed AT'] },
      { name: 'Equinox', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L Turbo I4','1.6L Diesel'], transmissions: ['6-Speed AT','9-Speed AT'] },
      { name: 'Tahoe', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['5.3L V8','6.2L V8','3.0L Diesel'], transmissions: ['10-Speed AT'] },
      { name: 'Traverse', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'Colorado', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','3.6L V6','2.7L Turbo I4','2.8L Diesel'], transmissions: ['8-Speed AT','9-Speed AT'] },
      { name: 'Bolt EV', years: [2017,2018,2019,2020,2021,2022,2023], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Bolt EUV', years: [2022,2023], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Chrysler', country: 'USA',
    models: [
      { name: '300', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023], engines: ['3.6L V6','5.7L V8'], transmissions: ['8-Speed AT'] },
      { name: 'Pacifica', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','3.6L V6 PHEV'], transmissions: ['9-Speed AT'] },
    ],
  },
  {
    name: 'Dodge', country: 'USA',
    models: [
      { name: 'Charger', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','5.7L V8','6.4L V8','6.2L Supercharged V8'], transmissions: ['8-Speed AT'] },
      { name: 'Challenger', years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023], engines: ['3.6L V6','5.7L V8','6.4L V8','6.2L Supercharged V8'], transmissions: ['8-Speed AT','6-Speed MT'] },
      { name: 'Durango', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','5.7L V8','6.4L V8'], transmissions: ['8-Speed AT'] },
      { name: 'Hornet', years: [2023,2024,2025], engines: ['2.0L Turbo I4','1.3L Turbo PHEV'], transmissions: ['9-Speed AT'] },
    ],
  },
  {
    name: 'Ford', country: 'USA',
    models: [
      { name: 'F-150', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.7L EcoBoost V6','3.5L EcoBoost V6','5.0L V8','3.0L Diesel','3.5L PowerBoost Hybrid'], transmissions: ['10-Speed AT'] },
      { name: 'Mustang', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.3L EcoBoost I4','5.0L V8','5.2L V8'], transmissions: ['10-Speed AT','6-Speed MT'] },
      { name: 'Explorer', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.3L EcoBoost I4','3.0L EcoBoost V6','3.3L V6 Hybrid'], transmissions: ['10-Speed AT'] },
      { name: 'Escape', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L EcoBoost I3','2.0L EcoBoost I4','2.5L Hybrid','2.5L PHEV'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'Edge', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L EcoBoost I4','2.7L EcoBoost V6'], transmissions: ['8-Speed AT'] },
      { name: 'Bronco', years: [2021,2022,2023,2024], engines: ['2.3L EcoBoost I4','2.7L EcoBoost V6'], transmissions: ['10-Speed AT','7-Speed MT'] },
      { name: 'Bronco Sport', years: [2021,2022,2023,2024], engines: ['1.5L EcoBoost I3','2.0L EcoBoost I4'], transmissions: ['8-Speed AT'] },
      { name: 'Maverick', years: [2022,2023,2024], engines: ['2.5L Hybrid','2.0L EcoBoost I4'], transmissions: ['CVT','8-Speed AT'] },
      { name: 'Ranger', years: [2019,2020,2021,2022,2023,2024], engines: ['2.3L EcoBoost I4','2.7L EcoBoost V6'], transmissions: ['10-Speed AT'] },
      { name: 'Mustang Mach-E', years: [2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'F-150 Lightning', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Genesis', country: 'South Korea',
    models: [
      { name: 'G70', years: [2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.3L Twin-Turbo V6'], transmissions: ['8-Speed AT'] },
      { name: 'G80', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L Turbo I4','3.5L Twin-Turbo V6','Electric'], transmissions: ['8-Speed AT'] },
      { name: 'GV70', years: [2022,2023,2024], engines: ['2.5L Turbo I4','3.5L Twin-Turbo V6','Electric'], transmissions: ['8-Speed AT'] },
      { name: 'GV80', years: [2021,2022,2023,2024], engines: ['2.5L Turbo I4','3.5L Twin-Turbo V6','3.0L Diesel'], transmissions: ['8-Speed AT'] },
    ],
  },
  {
    name: 'GMC', country: 'USA',
    models: [
      { name: 'Sierra 1500', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.7L Turbo I4','5.3L V8','6.2L V8','3.0L Diesel'], transmissions: ['8-Speed AT','10-Speed AT'] },
      { name: 'Terrain', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'Acadia', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','3.6L V6','2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'Yukon', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['5.3L V8','6.2L V8','3.0L Diesel'], transmissions: ['10-Speed AT'] },
      { name: 'Canyon', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','3.6L V6','2.7L Turbo I4','2.8L Diesel'], transmissions: ['8-Speed AT'] },
      { name: 'Hummer EV', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Honda', country: 'Japan',
    models: [
      { name: 'Civic', years: [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L I4','2.0L Hybrid','1.8L I4'], transmissions: ['CVT','6-Speed MT'] },
      { name: 'Accord', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L Turbo I4','2.0L Hybrid','2.4L I4'], transmissions: ['CVT','10-Speed AT','6-Speed MT'] },
      { name: 'CR-V', years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L Hybrid','2.4L I4'], transmissions: ['CVT'] },
      { name: 'HR-V', years: [2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.8L I4'], transmissions: ['CVT'] },
      { name: 'Pilot', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6','2.0L Turbo I4'], transmissions: ['10-Speed AT','9-Speed AT','6-Speed AT'] },
      { name: 'Passport', years: [2019,2020,2021,2022,2023,2024], engines: ['3.5L V6'], transmissions: ['9-Speed AT'] },
      { name: 'Odyssey', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6'], transmissions: ['10-Speed AT'] },
      { name: 'Ridgeline', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6'], transmissions: ['9-Speed AT'] },
    ],
  },
  {
    name: 'Hyundai', country: 'South Korea',
    models: [
      { name: 'Elantra', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.6L Turbo I4','1.6L Hybrid'], transmissions: ['CVT','IVT','7-Speed DCT','6-Speed AT'] },
      { name: 'Sonata', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','1.6L Turbo I4','2.0L Turbo I4','2.5L Hybrid'], transmissions: ['8-Speed AT','8-Speed DCT'] },
      { name: 'Tucson', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','1.6L Turbo Hybrid','1.6L Turbo PHEV'], transmissions: ['8-Speed AT'] },
      { name: 'Santa Fe', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.5L Turbo I4','1.6L Turbo Hybrid'], transmissions: ['8-Speed AT','8-Speed DCT'] },
      { name: 'Palisade', years: [2020,2021,2022,2023,2024], engines: ['3.8L V6'], transmissions: ['8-Speed AT'] },
      { name: 'Kona', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.6L Turbo I4','Electric'], transmissions: ['CVT','7-Speed DCT'] },
      { name: 'IONIQ 5', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'IONIQ 6', years: [2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Infiniti', country: 'Japan',
    models: [
      { name: 'Q50', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Twin-Turbo V6','3.7L V6'], transmissions: ['7-Speed AT'] },
      { name: 'Q60', years: [2017,2018,2019,2020,2021,2022], engines: ['2.0L Turbo I4','3.0L Twin-Turbo V6'], transmissions: ['7-Speed AT'] },
      { name: 'QX50', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L VC-Turbo I4'], transmissions: ['CVT'] },
      { name: 'QX60', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6','2.0L VC-Turbo I4'], transmissions: ['9-Speed AT','CVT'] },
      { name: 'QX80', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['5.6L V8'], transmissions: ['7-Speed AT','9-Speed AT'] },
    ],
  },
  {
    name: 'Jaguar', country: 'UK',
    models: [
      { name: 'F-PACE', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Supercharged V6','5.0L Supercharged V8'], transmissions: ['8-Speed AT'] },
      { name: 'E-PACE', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'I-PACE', years: [2019,2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'XF', years: [2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Supercharged V6'], transmissions: ['8-Speed AT'] },
    ],
  },
  {
    name: 'Jeep', country: 'USA',
    models: [
      { name: 'Wrangler', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','2.0L Turbo I4','3.0L Diesel','4.0L I6','6.4L V8'], transmissions: ['8-Speed AT','6-Speed MT'] },
      { name: 'Grand Cherokee', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','5.7L V8','2.0L Turbo PHEV','3.0L Diesel','6.4L V8'], transmissions: ['8-Speed AT'] },
      { name: 'Cherokee', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023], engines: ['2.4L I4','3.2L V6','2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'Compass', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.4L I4','2.0L Turbo I4'], transmissions: ['9-Speed AT','6-Speed AT'] },
      { name: 'Gladiator', years: [2020,2021,2022,2023,2024], engines: ['3.6L V6','3.0L Diesel'], transmissions: ['8-Speed AT','6-Speed MT'] },
      { name: 'Wagoneer', years: [2022,2023,2024], engines: ['3.0L Twin-Turbo I6','6.4L V8'], transmissions: ['8-Speed AT'] },
    ],
  },
  {
    name: 'Kia', country: 'South Korea',
    models: [
      { name: 'Forte', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.6L Turbo I4'], transmissions: ['CVT','IVT','7-Speed DCT'] },
      { name: 'K5', years: [2021,2022,2023,2024], engines: ['1.6L Turbo I4','2.5L I4','2.5L Turbo I4'], transmissions: ['8-Speed AT','8-Speed DCT'] },
      { name: 'Sportage', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','1.6L Turbo Hybrid','1.6L Turbo PHEV','2.0L Turbo I4'], transmissions: ['8-Speed AT','8-Speed DCT'] },
      { name: 'Sorento', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.5L Turbo I4','1.6L Turbo Hybrid','1.6L Turbo PHEV'], transmissions: ['8-Speed AT','8-Speed DCT'] },
      { name: 'Telluride', years: [2020,2021,2022,2023,2024], engines: ['3.8L V6'], transmissions: ['8-Speed AT'] },
      { name: 'Soul', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023], engines: ['2.0L I4','1.6L Turbo I4','Electric'], transmissions: ['CVT','IVT','7-Speed DCT'] },
      { name: 'EV6', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'EV9', years: [2024,2025], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Carnival', years: [2022,2023,2024], engines: ['3.5L V6'], transmissions: ['8-Speed AT'] },
    ],
  },
  {
    name: 'Land Rover', country: 'UK',
    models: [
      { name: 'Range Rover', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.4L V8','3.0L Diesel','5.0L Supercharged V8'], transmissions: ['8-Speed AT'] },
      { name: 'Range Rover Sport', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.4L V8','2.0L Turbo PHEV'], transmissions: ['8-Speed AT'] },
      { name: 'Range Rover Velar', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Supercharged V6'], transmissions: ['8-Speed AT'] },
      { name: 'Range Rover Evoque', years: [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['9-Speed AT'] },
      { name: 'Defender', years: [2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','5.0L Supercharged V8'], transmissions: ['8-Speed AT'] },
      { name: 'Discovery', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','3.0L Diesel'], transmissions: ['8-Speed AT'] },
    ],
  },
  {
    name: 'Lexus', country: 'Japan',
    models: [
      { name: 'IS', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.5L V6','2.5L Hybrid'], transmissions: ['8-Speed AT','6-Speed AT'] },
      { name: 'ES', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','3.5L V6','2.5L Hybrid'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'RX', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.4L Turbo I4','3.5L V6','2.5L Hybrid','2.5L PHEV'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'NX', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.4L Turbo I4','2.5L Hybrid','2.5L PHEV'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'GX', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['4.6L V8','2.4L Turbo I4','3.5L Twin-Turbo V6'], transmissions: ['6-Speed AT','8-Speed AT'] },
      { name: 'LX', years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['5.7L V8','3.5L Twin-Turbo V6'], transmissions: ['8-Speed AT','10-Speed AT'] },
      { name: 'RZ', years: [2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Lincoln', country: 'USA',
    models: [
      { name: 'Corsair', years: [2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.5L PHEV'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'Nautilus', years: [2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.7L Turbo V6'], transmissions: ['8-Speed AT'] },
      { name: 'Aviator', years: [2020,2021,2022,2023,2024], engines: ['3.0L Twin-Turbo V6','3.0L PHEV'], transmissions: ['10-Speed AT'] },
      { name: 'Navigator', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L Twin-Turbo V6'], transmissions: ['10-Speed AT'] },
    ],
  },
  {
    name: 'Mazda', country: 'Japan',
    models: [
      { name: 'Mazda3', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.5L Turbo I4','2.0L I4'], transmissions: ['6-Speed AT','6-Speed MT'] },
      { name: 'Mazda6', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021], engines: ['2.5L I4','2.5L Turbo I4','2.0L I4'], transmissions: ['6-Speed AT','6-Speed MT'] },
      { name: 'CX-5', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.5L Turbo I4','2.2L Diesel'], transmissions: ['6-Speed AT'] },
      { name: 'CX-30', years: [2020,2021,2022,2023,2024], engines: ['2.5L I4','2.5L Turbo I4'], transmissions: ['6-Speed AT'] },
      { name: 'CX-50', years: [2023,2024], engines: ['2.5L I4','2.5L Turbo I4'], transmissions: ['6-Speed AT'] },
      { name: 'CX-90', years: [2024,2025], engines: ['3.3L Turbo I6','2.5L PHEV'], transmissions: ['8-Speed AT'] },
      { name: 'MX-5 Miata', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.5L I4'], transmissions: ['6-Speed MT','6-Speed AT'] },
    ],
  },
  {
    name: 'Mercedes-Benz', country: 'Germany',
    models: [
      { name: 'C-Class', years: [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','4.0L V8','2.0L Diesel'], transmissions: ['9-Speed AT'] },
      { name: 'E-Class', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','4.0L V8','3.0L Diesel'], transmissions: ['9-Speed AT'] },
      { name: 'S-Class', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.0L V8','6.0L V12'], transmissions: ['9-Speed AT'] },
      { name: 'GLA', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['8-Speed DCT'] },
      { name: 'GLB', years: [2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['8-Speed DCT'] },
      { name: 'GLC', years: [2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','2.0L PHEV'], transmissions: ['9-Speed AT'] },
      { name: 'GLE', years: [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6','4.0L V8','3.0L Diesel'], transmissions: ['9-Speed AT'] },
      { name: 'GLS', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo I6','4.0L V8'], transmissions: ['9-Speed AT'] },
      { name: 'EQS', years: [2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'EQE', years: [2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'AMG GT', years: [2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['4.0L Twin-Turbo V8','3.0L Turbo I6'], transmissions: ['9-Speed AT','7-Speed DCT'] },
    ],
  },
  {
    name: 'Mitsubishi', country: 'Japan',
    models: [
      { name: 'Outlander', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','3.0L V6','2.5L PHEV'], transmissions: ['CVT'] },
      { name: 'Eclipse Cross', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.5L PHEV'], transmissions: ['CVT'] },
      { name: 'Mirage', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.2L I3'], transmissions: ['CVT','5-Speed MT'] },
    ],
  },
  {
    name: 'Nissan', country: 'Japan',
    models: [
      { name: 'Altima', years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.0L VC-Turbo I4','3.5L V6'], transmissions: ['CVT'] },
      { name: 'Sentra', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.8L I4'], transmissions: ['CVT'] },
      { name: 'Maxima', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023], engines: ['3.5L V6'], transmissions: ['CVT'] },
      { name: 'Rogue', years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','1.5L VC-Turbo I3'], transmissions: ['CVT'] },
      { name: 'Pathfinder', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6'], transmissions: ['9-Speed AT','CVT'] },
      { name: 'Murano', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6'], transmissions: ['CVT'] },
      { name: 'Frontier', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.8L V6','4.0L V6','2.5L I4'], transmissions: ['9-Speed AT','6-Speed MT'] },
      { name: 'Titan', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['5.6L V8','5.0L V8 Diesel'], transmissions: ['9-Speed AT','7-Speed AT'] },
      { name: 'LEAF', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Ariya', years: [2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Z', years: [2023,2024], engines: ['3.0L Twin-Turbo V6'], transmissions: ['9-Speed AT','6-Speed MT'] },
    ],
  },
  {
    name: 'Porsche', country: 'Germany',
    models: [
      { name: '911', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Twin-Turbo H6','3.7L Twin-Turbo H6','3.8L Twin-Turbo H6','4.0L H6'], transmissions: ['8-Speed PDK','7-Speed PDK','7-Speed MT'] },
      { name: 'Cayenne', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.0L Turbo V6','4.0L Twin-Turbo V8','2.9L Twin-Turbo V6','3.0L PHEV'], transmissions: ['8-Speed AT'] },
      { name: 'Macan', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.9L Twin-Turbo V6','Electric'], transmissions: ['7-Speed PDK'] },
      { name: 'Panamera', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.9L Twin-Turbo V6','4.0L Twin-Turbo V8','2.9L PHEV'], transmissions: ['8-Speed PDK'] },
      { name: 'Taycan', years: [2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['2-Speed AT'] },
    ],
  },
  {
    name: 'RAM', country: 'USA',
    models: [
      { name: '1500', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','5.7L V8','3.0L Diesel V6','3.6L eTorque','5.7L eTorque'], transmissions: ['8-Speed AT'] },
      { name: '2500', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['6.4L V8','6.7L Diesel I6'], transmissions: ['8-Speed AT','6-Speed AT'] },
      { name: 'ProMaster', years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.6L V6','3.0L Diesel I4'], transmissions: ['9-Speed AT','6-Speed AT'] },
    ],
  },
  {
    name: 'Subaru', country: 'Japan',
    models: [
      { name: 'Outback', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L H4','2.4L Turbo H4','3.6L H6'], transmissions: ['CVT'] },
      { name: 'Forester', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L H4','2.0L Turbo H4'], transmissions: ['CVT','6-Speed MT'] },
      { name: 'Crosstrek', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L H4','2.5L H4','2.5L PHEV'], transmissions: ['CVT','6-Speed MT'] },
      { name: 'Impreza', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L H4','2.5L H4'], transmissions: ['CVT','5-Speed MT'] },
      { name: 'WRX', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo H4','2.4L Turbo H4'], transmissions: ['CVT','6-Speed MT'] },
      { name: 'Legacy', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L H4','2.4L Turbo H4','3.6L H6'], transmissions: ['CVT'] },
      { name: 'Ascent', years: [2019,2020,2021,2022,2023,2024], engines: ['2.4L Turbo H4'], transmissions: ['CVT'] },
      { name: 'BRZ', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L H4','2.4L H4'], transmissions: ['6-Speed AT','6-Speed MT'] },
      { name: 'Solterra', years: [2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Tesla', country: 'USA',
    models: [
      { name: 'Model 3', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Model Y', years: [2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Model S', years: [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Model X', years: [2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Cybertruck', years: [2024,2025], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Toyota', country: 'Japan',
    models: [
      { name: 'Camry', years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','3.5L V6','2.5L Hybrid'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'Corolla', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L I4','1.8L I4','1.8L Hybrid','2.0L Hybrid'], transmissions: ['CVT','6-Speed MT'] },
      { name: 'RAV4', years: [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.5L I4','2.5L Hybrid','2.5L PHEV'], transmissions: ['8-Speed AT','CVT'] },
      { name: 'Highlander', years: [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.4L Turbo I4','3.5L V6','2.5L Hybrid'], transmissions: ['8-Speed AT','CVT'] },
      { name: '4Runner', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['4.0L V6','2.4L Turbo I4','2.4L Turbo Hybrid'], transmissions: ['5-Speed AT','8-Speed AT'] },
      { name: 'Tacoma', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.7L I4','3.5L V6','2.4L Turbo I4'], transmissions: ['6-Speed AT','6-Speed MT','8-Speed AT'] },
      { name: 'Tundra', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L Twin-Turbo V6','3.5L Hybrid','5.7L V8','4.6L V8'], transmissions: ['10-Speed AT','6-Speed AT'] },
      { name: 'Prius', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.8L Hybrid','2.0L Hybrid','1.8L PHEV'], transmissions: ['CVT'] },
      { name: 'Supra', years: [2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.0L Turbo I6'], transmissions: ['8-Speed AT','6-Speed MT'] },
      { name: 'GR86', years: [2022,2023,2024], engines: ['2.4L H4'], transmissions: ['6-Speed AT','6-Speed MT'] },
      { name: 'bZ4X', years: [2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'Sequoia', years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['5.7L V8','3.5L Twin-Turbo Hybrid'], transmissions: ['6-Speed AT','10-Speed AT'] },
      { name: 'Sienna', years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['3.5L V6','2.5L Hybrid'], transmissions: ['8-Speed AT','CVT'] },
    ],
  },
  {
    name: 'Volkswagen', country: 'Germany',
    models: [
      { name: 'Jetta', years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['1.5L Turbo I4','2.0L Turbo I4','1.4L Turbo I4','1.8L Turbo I4'], transmissions: ['8-Speed AT','6-Speed MT','7-Speed DSG'] },
      { name: 'Passat', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022], engines: ['2.0L Turbo I4','3.6L V6','1.8L Turbo I4'], transmissions: ['6-Speed AT','8-Speed AT','6-Speed DSG'] },
      { name: 'Golf', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','1.4L Turbo I4','2.0L TDI'], transmissions: ['8-Speed AT','6-Speed MT','7-Speed DSG'] },
      { name: 'GTI', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['7-Speed DSG','6-Speed MT'] },
      { name: 'Tiguan', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4'], transmissions: ['8-Speed AT'] },
      { name: 'Atlas', years: [2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','3.6L V6'], transmissions: ['8-Speed AT'] },
      { name: 'Taos', years: [2022,2023,2024], engines: ['1.5L Turbo I4'], transmissions: ['8-Speed AT','7-Speed DSG'] },
      { name: 'ID.4', years: [2021,2022,2023,2024], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
  {
    name: 'Volvo', country: 'Sweden',
    models: [
      { name: 'S60', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.0L PHEV'], transmissions: ['8-Speed AT'] },
      { name: 'S90', years: [2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.0L PHEV'], transmissions: ['8-Speed AT'] },
      { name: 'XC40', years: [2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','Electric','2.0L PHEV'], transmissions: ['8-Speed AT','Single-Speed'] },
      { name: 'XC60', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.0L PHEV','T8 Supercharged/Turbo'], transmissions: ['8-Speed AT'] },
      { name: 'XC90', years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024], engines: ['2.0L Turbo I4','2.0L PHEV','4.4L V8','3.2L I6'], transmissions: ['8-Speed AT','6-Speed AT'] },
      { name: 'EX30', years: [2024,2025], engines: ['Electric'], transmissions: ['Single-Speed'] },
      { name: 'EX90', years: [2024,2025], engines: ['Electric'], transmissions: ['Single-Speed'] },
    ],
  },
];

export function getAllMakeNames(): string[] {
  return vehicleMakes.map(m => m.name).sort();
}

export function getModelsByMake(makeName: string): string[] {
  const make = vehicleMakes.find(m => m.name.toLowerCase() === makeName.toLowerCase());
  return make ? make.models.map(m => m.name).sort() : [];
}

export function getYearsByMakeModel(makeName: string, modelName: string): number[] {
  const make = vehicleMakes.find(m => m.name.toLowerCase() === makeName.toLowerCase());
  if (!make) return [];
  const model = make.models.find(m => m.name.toLowerCase() === modelName.toLowerCase());
  return model ? [...model.years].sort((a, b) => b - a) : [];
}

export function getEnginesByMakeModel(makeName: string, modelName: string): string[] {
  const make = vehicleMakes.find(m => m.name.toLowerCase() === makeName.toLowerCase());
  if (!make) return [];
  const model = make.models.find(m => m.name.toLowerCase() === modelName.toLowerCase());
  return model ? model.engines : [];
}

export function getTransmissionsByMakeModel(makeName: string, modelName: string): string[] {
  const make = vehicleMakes.find(m => m.name.toLowerCase() === makeName.toLowerCase());
  if (!make) return [];
  const model = make.models.find(m => m.name.toLowerCase() === modelName.toLowerCase());
  return model ? model.transmissions : [];
}
