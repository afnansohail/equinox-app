-- Equinox PSX Portfolio Tracker - Seed Data
-- Run this after schema.sql to populate initial stock symbols
-- These are popular PSX stocks that will be updated with live data from the scraper

-- KSE-100 Major Stocks
INSERT INTO stocks (symbol, name, sector) VALUES
  -- Oil & Gas
  ('OGDC', 'Oil & Gas Development Company Limited', 'OIL & GAS EXPLORATION COMPANIES'),
  ('PPL', 'Pakistan Petroleum Limited', 'OIL & GAS EXPLORATION COMPANIES'),
  ('MARI', 'Mari Petroleum Company Limited', 'OIL & GAS EXPLORATION COMPANIES'),
  ('POL', 'Pakistan Oilfields Limited', 'OIL & GAS EXPLORATION COMPANIES'),
  ('PSO', 'Pakistan State Oil Company Limited', 'OIL & GAS MARKETING COMPANIES'),
  ('APL', 'Attock Petroleum Limited', 'OIL & GAS MARKETING COMPANIES'),
  ('SNGPL', 'Sui Northern Gas Pipelines Limited', 'GAS & WATER UTILITIES'),
  ('SSGC', 'Sui Southern Gas Company Limited', 'GAS & WATER UTILITIES'),
  
  -- Banking
  ('HBL', 'Habib Bank Limited', 'COMMERCIAL BANKS'),
  ('MCB', 'MCB Bank Limited', 'COMMERCIAL BANKS'),
  ('UBL', 'United Bank Limited', 'COMMERCIAL BANKS'),
  ('BAFL', 'Bank Alfalah Limited', 'COMMERCIAL BANKS'),
  ('ABL', 'Allied Bank Limited', 'COMMERCIAL BANKS'),
  ('BAHL', 'Bank Al Habib Limited', 'COMMERCIAL BANKS'),
  ('MEBL', 'Meezan Bank Limited', 'COMMERCIAL BANKS'),
  ('NBP', 'National Bank of Pakistan', 'COMMERCIAL BANKS'),
  ('AKBL', 'Askari Bank Limited', 'COMMERCIAL BANKS'),
  
  -- Fertilizer
  ('EFERT', 'Engro Fertilizers Limited', 'FERTILIZER'),
  ('FFC', 'Fauji Fertilizer Company Limited', 'FERTILIZER'),
  ('FFBL', 'Fauji Fertilizer Bin Qasim Limited', 'FERTILIZER'),
  ('FATIMA', 'Fatima Fertilizer Company Limited', 'FERTILIZER'),
  
  -- Cement
  ('LUCK', 'Lucky Cement Limited', 'CEMENT'),
  ('DGKC', 'D.G. Khan Cement Company Limited', 'CEMENT'),
  ('MLCF', 'Maple Leaf Cement Factory Limited', 'CEMENT'),
  ('FCCL', 'Fauji Cement Company Limited', 'CEMENT'),
  ('CHCC', 'Cherat Cement Company Limited', 'CEMENT'),
  ('KOHC', 'Kohat Cement Company Limited', 'CEMENT'),
  ('PIOC', 'Pioneer Cement Limited', 'CEMENT'),
  
  -- Power Generation
  ('HUBC', 'Hub Power Company Limited', 'POWER GENERATION & DISTRIBUTION'),
  ('KAPCO', 'Kot Addu Power Company Limited', 'POWER GENERATION & DISTRIBUTION'),
  ('NPL', 'Nishat Power Limited', 'POWER GENERATION & DISTRIBUTION'),
  ('NCPL', 'Nishat Chunian Power Limited', 'POWER GENERATION & DISTRIBUTION'),
  
  -- Technology & Systems
  ('SYS', 'Systems Limited', 'TECHNOLOGY & COMMUNICATION'),
  ('TRG', 'TRG Pakistan Limited', 'TECHNOLOGY & COMMUNICATION'),
  ('NETSOL', 'NetSol Technologies Limited', 'TECHNOLOGY & COMMUNICATION'),
  ('AVN', 'Avanceon Limited', 'TECHNOLOGY & COMMUNICATION'),
  
  -- Automobile
  ('INDU', 'Indus Motor Company Limited', 'AUTOMOBILE ASSEMBLER'),
  ('PSMC', 'Pak Suzuki Motor Company Limited', 'AUTOMOBILE ASSEMBLER'),
  ('HCAR', 'Honda Atlas Cars (Pakistan) Limited', 'AUTOMOBILE ASSEMBLER'),
  ('MTL', 'Millat Tractors Limited', 'AUTOMOBILE ASSEMBLER'),
  ('AGTL', 'Al-Ghazi Tractors Limited', 'AUTOMOBILE ASSEMBLER'),
  
  -- Pharmaceutical
  ('GLAXO', 'GlaxoSmithKline Pakistan Limited', 'PHARMACEUTICALS'),
  ('SEARL', 'The Searle Company Limited', 'PHARMACEUTICALS'),
  ('AGP', 'AGP Limited', 'PHARMACEUTICALS'),
  ('HINOON', 'Highnoon Laboratories Limited', 'PHARMACEUTICALS'),
  ('FEROZ', 'Ferozsons Laboratories Limited', 'PHARMACEUTICALS'),
  
  -- Textile
  ('NML', 'Nishat Mills Limited', 'TEXTILE COMPOSITE'),
  ('NCL', 'Nishat Chunian Limited', 'TEXTILE COMPOSITE'),
  ('ILP', 'Interloop Limited', 'TEXTILE COMPOSITE'),
  ('GATM', 'Gul Ahmed Textile Mills Limited', 'TEXTILE COMPOSITE'),
  
  -- Food & Consumer
  ('ENGRO', 'Engro Corporation Limited', 'FOOD & PERSONAL CARE PRODUCTS'),
  ('EFOODS', 'Engro Foods Limited', 'FOOD & PERSONAL CARE PRODUCTS'),
  ('NESTLE', 'Nestle Pakistan Limited', 'FOOD & PERSONAL CARE PRODUCTS'),
  ('COLG', 'Colgate-Palmolive (Pakistan) Limited', 'FOOD & PERSONAL CARE PRODUCTS'),
  ('UNITY', 'Unity Foods Limited', 'FOOD & PERSONAL CARE PRODUCTS'),
  
  -- Steel
  ('ISL', 'International Steels Limited', 'ENGINEERING'),
  ('ASL', 'Amreli Steels Limited', 'ENGINEERING'),
  ('ASTL', 'Agha Steel Industries Limited', 'ENGINEERING'),
  
  -- Insurance
  ('JSGHL', 'JS Global Capital Holdings Limited', 'INV. BANKS / INV. COS. / SECURITIES COS.'),
  ('EFGH', 'EFG Hermes Pakistan Limited', 'INV. BANKS / INV. COS. / SECURITIES COS.'),
  
  -- Real Estate & Construction
  ('AIRLINK', 'Airlink Communication Limited', 'TECHNOLOGY HARDWARE & EQUIPMENT'),
  ('LOTCHEM', 'Lotte Chemical Pakistan Limited', 'CHEMICALS'),
  ('ICI', 'ICI Pakistan Limited', 'CHEMICALS'),
  ('EPCL', 'Engro Polymer & Chemicals Limited', 'CHEMICALS'),
  
  -- Telecom
  ('PTC', 'Pakistan Telecommunication Company Limited', 'TECHNOLOGY & COMMUNICATION'),
  ('WTL', 'WorldCall Telecom Limited', 'TECHNOLOGY & COMMUNICATION'),
  
  -- Airlines & Transport
  ('PIAC', 'Pakistan International Airlines Corporation', 'TRANSPORT'),
  ('PAEL', 'Pak Elektron Limited', 'ELECTRICAL MACHINERY'),
  
  -- Others
  ('KEL', 'K-Electric Limited', 'POWER GENERATION & DISTRIBUTION'),
  ('ATRL', 'Attock Refinery Limited', 'REFINERY'),
  ('NRL', 'National Refinery Limited', 'REFINERY'),
  ('PRL', 'Pakistan Refinery Limited', 'REFINERY'),
  ('BYCO', 'Byco Petroleum Pakistan Limited', 'REFINERY'),
  
  -- Glass & Ceramics
  ('TGL', 'Tariq Glass Industries Limited', 'GLASS & CERAMICS'),
  ('GHGL', 'Ghani Glass Limited', 'GLASS & CERAMICS'),
  
  -- Paper & Board
  ('CEPB', 'Century Paper & Board Mills Limited', 'PAPER & BOARD'),
  ('PKGS', 'Packages Limited', 'PAPER & BOARD'),
  
  -- Leather
  ('SRVI', 'Service Industries Limited', 'LEATHER & TANNERIES'),
  
  -- Sugar
  ('JDWS', 'JDW Sugar Mills Limited', 'SUGAR & ALLIED INDUSTRIES'),
  ('ALNRS', 'Al-Noor Sugar Mills Limited', 'SUGAR & ALLIED INDUSTRIES')
  
ON CONFLICT (symbol) DO NOTHING;
