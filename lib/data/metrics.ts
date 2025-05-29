// lib/data/metrics.ts

export interface Metric {
    category: 'economic' | 'political' | 'social' | 'environmental' | 'composite';
    name: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    timing: 'leading' | 'coincident' | 'lagging';
    source: string;
    impact: string;
  }
  
  export const metricsData: Metric[] = [
    // Economic - Growth Indicators
    {
      category: 'economic',
      name: 'Real GDP Growth Rate',
      description: 'Quarterly annualized growth rate of inflation-adjusted gross domestic product',
      priority: 'critical',
      frequency: 'quarterly',
      timing: 'lagging',
      source: 'Bureau of Economic Analysis',
      impact: 'Primary economic health indicator, drives overall market sentiment'
    },
    {
      category: 'economic',
      name: 'GDP Now',
      description: 'Fed\'s real-time estimate of current quarter GDP growth',
      priority: 'critical',
      frequency: 'weekly',
      timing: 'coincident',
      source: 'Federal Reserve Bank of Atlanta',
      impact: 'Early GDP signal, affects Fed policy expectations'
    },
    {
      category: 'economic',
      name: 'Manufacturing PMI',
      description: 'ISM Manufacturing Index measuring factory activity',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Institute for Supply Management',
      impact: 'Key business cycle indicator, 50+ indicates expansion'
    },
    {
      category: 'economic',
      name: 'Services PMI',
      description: 'ISM Non-Manufacturing Index measuring service sector activity',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Institute for Supply Management',
      impact: 'Critical for service-heavy economy, affects employment'
    },
    {
      category: 'economic',
      name: 'Industrial Production Index',
      description: 'Monthly measure of manufacturing, mining, and utility output',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Federal Reserve',
      impact: 'Reflects industrial sector health, commodity demand'
    },
    {
      category: 'economic',
      name: 'Capacity Utilization Rate',
      description: 'Percentage of industrial capacity currently in use',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Federal Reserve',
      impact: 'Inflation pressure indicator, investment demand signal'
    },
  
    // Economic - Employment
    {
      category: 'economic',
      name: 'Unemployment Rate (U-3)',
      description: 'Percentage of labor force actively seeking work',
      priority: 'critical',
      frequency: 'monthly',
      timing: 'lagging',
      source: 'Bureau of Labor Statistics',
      impact: 'Fed dual mandate metric, consumer spending driver'
    },
    {
      category: 'economic',
      name: 'Non-Farm Payrolls',
      description: 'Monthly change in employed persons excluding farm workers',
      priority: 'critical',
      frequency: 'monthly',
      timing: 'lagging',
      source: 'Bureau of Labor Statistics',
      impact: 'Most watched employment metric, market moving'
    },
    {
      category: 'economic',
      name: 'Initial Jobless Claims',
      description: 'Weekly new unemployment insurance applications',
      priority: 'high',
      frequency: 'weekly',
      timing: 'leading',
      source: 'Department of Labor',
      impact: 'Real-time labor market health, recession early warning'
    },
    {
      category: 'economic',
      name: 'Job Openings (JOLTS)',
      description: 'Monthly job openings and labor turnover data',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Bureau of Labor Statistics',
      impact: 'Labor market tightness, wage pressure indicator'
    },
    {
      category: 'economic',
      name: 'Average Hourly Earnings',
      description: 'Monthly growth in average hourly wages',
      priority: 'high',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Bureau of Labor Statistics',
      impact: 'Inflation component, consumer purchasing power'
    },
    {
      category: 'economic',
      name: 'Labor Force Participation Rate',
      description: 'Percentage of working-age population in labor force',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'lagging',
      source: 'Bureau of Labor Statistics',
      impact: 'Structural employment trends, demographic shifts'
    },
  
    // Economic - Inflation
    {
      category: 'economic',
      name: 'Core CPI',
      description: 'Consumer Price Index excluding food and energy',
      priority: 'critical',
      frequency: 'monthly',
      timing: 'lagging',
      source: 'Bureau of Labor Statistics',
      impact: 'Fed policy primary target, bond market driver'
    },
    {
      category: 'economic',
      name: 'Core PCE',
      description: 'Personal Consumption Expenditures Price Index excluding food/energy',
      priority: 'critical',
      frequency: 'monthly',
      timing: 'lagging',
      source: 'Bureau of Economic Analysis',
      impact: 'Fed\'s preferred inflation measure'
    },
    {
      category: 'economic',
      name: 'Producer Price Index (PPI)',
      description: 'Wholesale price changes for finished goods',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Bureau of Labor Statistics',
      impact: 'Future consumer price pressure indicator'
    },
    {
      category: 'economic',
      name: '5Y5Y Forward Inflation Rate',
      description: 'Market-implied inflation expectations 5 years forward',
      priority: 'high',
      frequency: 'daily',
      timing: 'leading',
      source: 'Federal Reserve/FRED',
      impact: 'Long-term inflation expectations, Fed credibility'
    },
    {
      category: 'economic',
      name: 'TIPS Breakeven Rates',
      description: 'Treasury Inflation-Protected Securities implied inflation',
      priority: 'medium',
      frequency: 'daily',
      timing: 'leading',
      source: 'Treasury/Bloomberg',
      impact: 'Market-based inflation expectations'
    },
  
    // Economic - Consumer/Business
    {
      category: 'economic',
      name: 'Consumer Confidence Index',
      description: 'Consumer Board survey of consumer attitudes',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Conference Board',
      impact: 'Consumer spending predictor, 70% of GDP'
    },
    {
      category: 'economic',
      name: 'Retail Sales',
      description: 'Monthly change in retail and food service sales',
      priority: 'high',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'U.S. Census Bureau',
      impact: 'Consumer spending health, economic activity'
    },
    {
      category: 'economic',
      name: 'Personal Consumption Expenditures',
      description: 'Consumer spending on goods and services',
      priority: 'high',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Bureau of Economic Analysis',
      impact: 'Largest GDP component, economic driver'
    },
    {
      category: 'economic',
      name: 'Durable Goods Orders',
      description: 'Orders for long-lasting manufactured goods',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'leading',
      source: 'U.S. Census Bureau',
      impact: 'Business investment indicator, manufacturing demand'
    },
  
    // Economic - Financial Conditions
    {
      category: 'economic',
      name: 'Fed Funds Rate',
      description: 'Federal Reserve\'s target interest rate',
      priority: 'critical',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Federal Reserve',
      impact: 'Risk-free rate, all asset pricing foundation'
    },
    {
      category: 'economic',
      name: '10-Year Treasury Yield',
      description: 'Yield on 10-year U.S. Treasury bond',
      priority: 'critical',
      frequency: 'daily',
      timing: 'leading',
      source: 'Treasury/Bloomberg',
      impact: 'Benchmark rate, economic growth expectations'
    },
    {
      category: 'economic',
      name: '2s-10s Yield Curve',
      description: 'Spread between 2-year and 10-year Treasury yields',
      priority: 'critical',
      frequency: 'daily',
      timing: 'leading',
      source: 'Treasury/FRED',
      impact: 'Recession predictor, banking profitability'
    },
    {
      category: 'economic',
      name: 'Credit Spreads (IG)',
      description: 'Investment grade corporate bond spreads over Treasuries',
      priority: 'high',
      frequency: 'daily',
      timing: 'leading',
      source: 'Bloomberg/ICE',
      impact: 'Credit risk appetite, financial stress indicator'
    },
    {
      category: 'economic',
      name: 'Credit Spreads (HY)',
      description: 'High yield corporate bond spreads over Treasuries',
      priority: 'high',
      frequency: 'daily',
      timing: 'leading',
      source: 'Bloomberg/ICE',
      impact: 'Risk appetite, economic stress measure'
    },
    {
      category: 'economic',
      name: 'TED Spread',
      description: '3-month Treasury vs 3-month LIBOR spread',
      priority: 'medium',
      frequency: 'daily',
      timing: 'leading',
      source: 'Federal Reserve',
      impact: 'Banking system stress, liquidity conditions'
    },
  
    // Economic - Fed Policy
    {
      category: 'economic',
      name: 'Fed Funds Futures',
      description: 'Market-implied future Fed funds rate expectations',
      priority: 'high',
      frequency: 'daily',
      timing: 'leading',
      source: 'CME Group',
      impact: 'Policy expectations, rate sensitive sector guidance'
    },
    {
      category: 'economic',
      name: 'Fed Balance Sheet',
      description: 'Total Federal Reserve system assets',
      priority: 'high',
      frequency: 'weekly',
      timing: 'leading',
      source: 'Federal Reserve',
      impact: 'Monetary policy stance, liquidity provision'
    },
    {
      category: 'economic',
      name: 'FOMC Dot Plot',
      description: 'Fed officials\' rate projections',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'leading',
      source: 'Federal Reserve',
      impact: 'Policy path guidance, long-term rate expectations'
    },
  
    // Political - U.S. Domestic
    {
      category: 'political',
      name: 'Presidential Approval Rating',
      description: 'Public approval of current president\'s performance',
      priority: 'medium',
      frequency: 'weekly',
      timing: 'leading',
      source: 'Gallup/RealClearPolitics',
      impact: 'Policy implementation probability, market stability'
    },
    {
      category: 'political',
      name: 'Congressional Approval',
      description: 'Public approval of Congress performance',
      priority: 'low',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Gallup',
      impact: 'Legislative effectiveness, policy gridlock indicator'
    },
    {
      category: 'political',
      name: 'Generic Ballot Polling',
      description: 'Polling for upcoming congressional elections',
      priority: 'medium',
      frequency: 'weekly',
      timing: 'leading',
      source: 'RealClearPolitics',
      impact: 'Potential policy shifts, regulatory changes'
    },
    {
      category: 'political',
      name: 'Tax Policy Changes',
      description: 'Proposed or enacted changes to corporate/individual tax rates',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Congress/Treasury',
      impact: 'Corporate earnings, investment incentives'
    },
    {
      category: 'political',
      name: 'Trade Policy/Tariffs',
      description: 'International trade policy and tariff announcements',
      priority: 'high',
      frequency: 'weekly',
      timing: 'leading',
      source: 'USTR/Commerce Dept',
      impact: 'Supply chain costs, international competitiveness'
    },
    {
      category: 'political',
      name: 'Infrastructure Spending',
      description: 'Government infrastructure investment programs',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'leading',
      source: 'Congress/DOT',
      impact: 'Construction, materials, employment sectors'
    },
    {
      category: 'political',
      name: 'Healthcare Policy',
      description: 'Changes to healthcare regulation and programs',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'leading',
      source: 'HHS/Congress',
      impact: 'Healthcare sector, insurance costs'
    },
    {
      category: 'political',
      name: 'Financial Regulation',
      description: 'Banking and financial services regulatory changes',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Fed/OCC/SEC',
      impact: 'Banking profitability, lending standards'
    },
    {
      category: 'political',
      name: 'Antitrust Enforcement',
      description: 'DOJ and FTC antitrust investigation and enforcement',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'leading',
      source: 'DOJ/FTC',
      impact: 'Big tech, M&A activity, market concentration'
    },
  
    // Political - Geopolitical
    {
      category: 'political',
      name: 'China-US Relations',
      description: 'Bilateral relationship status and trade negotiations',
      priority: 'high',
      frequency: 'weekly',
      timing: 'leading',
      source: 'State Dept/USTR',
      impact: 'Supply chains, technology sector, global trade'
    },
    {
      category: 'political',
      name: 'Military Conflicts',
      description: 'Active military conflicts affecting global stability',
      priority: 'high',
      frequency: 'daily',
      timing: 'leading',
      source: 'DOD/State Dept',
      impact: 'Energy prices, defense spending, safe haven flows'
    },
    {
      category: 'political',
      name: 'Sanctions Regimes',
      description: 'International economic sanctions and restrictions',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Treasury/State Dept',
      impact: 'International business, commodity flows'
    },
    {
      category: 'political',
      name: 'Energy Geopolitics',
      description: 'International energy policy and pipeline developments',
      priority: 'medium',
      frequency: 'weekly',
      timing: 'leading',
      source: 'Energy Dept/IEA',
      impact: 'Energy sector, inflation, currency flows'
    },
  
    // Social/Demographic
    {
      category: 'social',
      name: 'Population Growth by Cohort',
      description: 'Age-specific population growth rates and projections',
      priority: 'low',
      frequency: 'quarterly',
      timing: 'lagging',
      source: 'Census Bureau',
      impact: 'Long-term consumption patterns, sector demand'
    },
    {
      category: 'social',
      name: 'Labor Force Participation by Age',
      description: 'Workforce participation rates across age groups',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Bureau of Labor Statistics',
      impact: 'Labor supply, wage pressure, productivity'
    },
    {
      category: 'social',
      name: 'Millennial Homeownership Rate',
      description: 'Homeownership rates for millennial generation',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'lagging',
      source: 'Census Bureau/NAR',
      impact: 'Housing demand, construction, home improvement'
    },
    {
      category: 'social',
      name: 'Student Loan Debt Levels',
      description: 'Outstanding student loan debt by demographic',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'lagging',
      source: 'Fed/Education Dept',
      impact: 'Consumer spending capacity, housing demand'
    },
    {
      category: 'social',
      name: 'E-commerce Penetration',
      description: 'Online retail as percentage of total retail sales',
      priority: 'high',
      frequency: 'quarterly',
      timing: 'coincident',
      source: 'Census Bureau',
      impact: 'Retail real estate, logistics, traditional retail'
    },
    {
      category: 'social',
      name: 'Work-from-Home Prevalence',
      description: 'Percentage of workforce working remotely',
      priority: 'high',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Bureau of Labor Statistics',
      impact: 'Commercial real estate, transportation, technology'
    },
    {
      category: 'social',
      name: 'Digital Payment Adoption',
      description: 'Adoption rates of digital payment methods',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'leading',
      source: 'Fed/Payment processors',
      impact: 'Fintech sector, traditional banking, cash usage'
    },
    {
      category: 'social',
      name: 'Income Inequality (Gini)',
      description: 'Gini coefficient measuring income distribution',
      priority: 'low',
      frequency: 'quarterly',
      timing: 'lagging',
      source: 'Census Bureau',
      impact: 'Political stability, consumption patterns, policy'
    },
    {
      category: 'social',
      name: 'Healthcare Costs/Access',
      description: 'Healthcare spending and access metrics',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'lagging',
      source: 'CMS/Census',
      impact: 'Healthcare sector, consumer spending, policy'
    },
  
    // Environmental
    {
      category: 'environmental',
      name: 'Global Temperature Anomalies',
      description: 'Deviation from long-term global temperature averages',
      priority: 'low',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'NOAA/NASA',
      impact: 'Agriculture, energy demand, insurance costs'
    },
    {
      category: 'environmental',
      name: 'Extreme Weather Frequency',
      description: 'Frequency and severity of extreme weather events',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'coincident',
      source: 'NOAA/Insurance industry',
      impact: 'Insurance sector, agriculture, infrastructure costs'
    },
    {
      category: 'environmental',
      name: 'Renewable Energy Capacity',
      description: 'New renewable energy installations and capacity',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'leading',
      source: 'Energy Dept/EIA',
      impact: 'Energy sector transition, grid infrastructure'
    },
    {
      category: 'environmental',
      name: 'Electric Vehicle Adoption',
      description: 'EV sales as percentage of total vehicle sales',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Auto industry/IEA',
      impact: 'Auto sector, battery materials, oil demand'
    },
    {
      category: 'environmental',
      name: 'Carbon Pricing Mechanisms',
      description: 'Implementation and pricing of carbon taxes/cap-and-trade',
      priority: 'medium',
      frequency: 'quarterly',
      timing: 'leading',
      source: 'Government agencies',
      impact: 'Energy costs, industrial competitiveness'
    },
    {
      category: 'environmental',
      name: 'Green Bond Issuance',
      description: 'Volume of green bond issuances and ESG investing',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Bloomberg/MSCI',
      impact: 'Capital allocation, corporate funding costs'
    },
    {
      category: 'environmental',
      name: 'ESG Fund Flows',
      description: 'Investment flows into ESG-focused funds',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Morningstar/BlackRock',
      impact: 'Stock selection, sector rotation, valuations'
    },
    {
      category: 'environmental',
      name: 'Corporate Climate Commitments',
      description: 'Corporate net-zero commitments and progress',
      priority: 'low',
      frequency: 'quarterly',
      timing: 'leading',
      source: 'CDP/Corporate reports',
      impact: 'Capital expenditure, operational changes, competitiveness'
    },
  
    // Composite Indicators
    {
      category: 'composite',
      name: 'Conference Board LEI',
      description: 'Leading Economic Index combining multiple indicators',
      priority: 'critical',
      frequency: 'monthly',
      timing: 'leading',
      source: 'Conference Board',
      impact: 'Recession probability, broad economic direction'
    },
    {
      category: 'composite',
      name: 'OECD Composite Leading Indicators',
      description: 'International leading indicators for major economies',
      priority: 'high',
      frequency: 'monthly',
      timing: 'leading',
      source: 'OECD',
      impact: 'Global economic coordination, international exposure'
    },
    {
      category: 'composite',
      name: 'Goldman Sachs CAI',
      description: 'Current Activity Indicator tracking real-time economic activity',
      priority: 'high',
      frequency: 'weekly',
      timing: 'coincident',
      source: 'Goldman Sachs Research',
      impact: 'High-frequency economic pulse, nowcasting'
    },
    {
      category: 'composite',
      name: 'Chicago Fed CFNAI',
      description: 'National Activity Index of 85 economic indicators',
      priority: 'medium',
      frequency: 'monthly',
      timing: 'coincident',
      source: 'Federal Reserve Bank of Chicago',
      impact: 'Broad-based economic activity, inflation pressure'
    },
    {
      category: 'composite',
      name: 'Goldman Sachs FCI',
      description: 'Financial Conditions Index measuring credit availability',
      priority: 'high',
      frequency: 'daily',
      timing: 'leading',
      source: 'Goldman Sachs Research',
      impact: 'Credit availability, financial stress, risk appetite'
    },
    {
      category: 'composite',
      name: 'Chicago Fed NFCI',
      description: 'National Financial Conditions Index',
      priority: 'high',
      frequency: 'weekly',
      timing: 'leading',
      source: 'Federal Reserve Bank of Chicago',
      impact: 'Financial stress, credit conditions, systemic risk'
    }
  ];
  
  export default metricsData;