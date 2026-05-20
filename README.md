# CarDiag Pro v2.0.0

A comprehensive automotive diagnostic application with Progressive Web App (PWA) capabilities, built for professional vehicle diagnostics, maintenance tracking, and fleet management.

## Features

### Core Diagnostics
- **Real-time OBD-II diagnostics** with support for multiple protocols
- **Live sensor data** monitoring and visualization
- **Trouble code (DTC) reading and clearing** with detailed descriptions
- **Vehicle health scoring** and comprehensive analysis
- **Multi-protocol support** (ISO 9141, KWP2000, CAN, J1939, etc.)

### Vehicle Management
- **Multi-vehicle support** with complete fleet management
- **Vehicle profiles** with detailed specifications and history
- **Import/export** vehicle data and settings
- **Active vehicle switching** for seamless multi-car management

### Maintenance & Service
- **Maintenance tracking** with complete service history
- **Automated maintenance schedules** with reminders
- **Service scheduling** integration with local shops
- **Cost estimation** with parts and labor calculations
- **Predictive maintenance** algorithms and risk analysis

### Analytics & Reporting
- **Advanced analytics** with historical data trends
- **Interactive charts** for costs, health, and usage patterns
- **Comprehensive reports** with export capabilities
- **Fleet analytics** for multiple vehicle management
- **Predictive insights** and maintenance forecasting

### PWA Features
- **Offline functionality** with service worker caching
- **Installable app** on desktop and mobile devices
- **Push notifications** for maintenance reminders
- **Responsive design** optimized for all screen sizes
- **Background sync** for data updates

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **PWA**: Service Worker, Web App Manifest
- **State Management**: React Context API
- **Data Storage**: LocalStorage with export/import capabilities
- **Icons**: Lucide React
- **Charts**: Custom visualization components

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser with Web Serial API support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prodeo5454/CarDiag.git
   cd CarDiag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

### Android release

```bash
npm run build:oem-db
npm run android:build      # dev APK / Android Studio
npm run android:bundle     # Play Store .aab (needs android/keystore.properties)
npm run android:open
```

See [ANDROID.md](ANDROID.md) for Play Store signing and [CHANGELOG.md](CHANGELOG.md) for release notes.

## Usage

### Initial Setup
1. **Connect OBD-II Adapter**: Connect your vehicle's OBD-II adapter via USB or Bluetooth
2. **Add Vehicle**: Create a vehicle profile or let the app auto-detect from ECU
3. **Start Diagnostics**: Begin scanning for trouble codes and live data

### Key Features

#### Dashboard
- Real-time vehicle health monitoring
- Quick access to diagnostics and maintenance
- Fleet overview statistics

#### Diagnostics
- Live sensor data visualization
- Trouble code reading and clearing
- Protocol detection and configuration
- ECU information display
- Offline OEM DTC database with custom JSON import and weekly update checks

#### ECU Coding & Key Programming (`/programming`)
- UDS read/write of coding data identifiers (DIDs) with risk confirmations
- Guided immobilizer / key procedures (add spare, all-keys-lost workflows)
- Security access (UDS 0x27) using manufacturer seed-key profiles
- **Hardware limits**: Full reprogramming and dealer-level key coding typically require STN1110/OBDLink-class adapters or OEM tools—not generic ELM327 clones. Incorrect writes can damage ECUs.

#### Maintenance
- Service history tracking
- Maintenance scheduling
- Cost analysis and reporting
- Parts and labor estimation

#### Analytics
- Historical trend analysis
- Cost breakdown and projections
- Vehicle health patterns
- Predictive maintenance insights

#### Settings
- User preferences configuration
- Data import/export
- PWA management
- Notification settings

## Browser Compatibility

CarDiag Pro requires modern browsers with support for:
- **Web Serial API** (for OBD-II communication)
- **Service Workers** (for PWA functionality)
- **ES6+ JavaScript features**

**Supported Browsers:**
- Chrome 89+
- Edge 89+
- Firefox 90+ (limited Web Serial support)
- Safari 15+ (limited Web Serial support)

## OBD-II Adapter Compatibility

### Supported Adapters
- **ELM327** based adapters (USB, Bluetooth, WiFi)
- **J2534 Pass-thru** devices
- **Custom serial adapters**
- **OBDLink** series adapters

### Supported Protocols
- **SAE J1850 PWM** (41.6 kbaud)
- **SAE J1850 VPW** (10.4 kbaud)
- **ISO 9141-2** (5 baud init, 10.4 kbaud)
- **ISO 14230-4 KWP** (5 baud init, 10.4 kbaud)
- **ISO 14230-4 KWP** (fast init, 10.4 kbaud)
- **ISO 15765-4 CAN** (11 bit ID, 500 kbaud)
- **ISO 15765-4 CAN** (29 bit ID, 500 kbaud)
- **ISO 15765-4 CAN** (11 bit ID, 250 kbaud)
- **ISO 15765-4 CAN** (29 bit ID, 250 kbaud)
- **SAE J1939 CAN** (29 bit ID, 250* kbaud)

## Data Management

### Local Storage
- All data is stored locally in the browser
- Automatic backup and restore capabilities
- Export data in JSON format for backup

### Data Export/Import
- **Vehicle profiles**: Complete vehicle data and history
- **Maintenance records**: Service history and costs
- **Diagnostic reports**: Scan results and analysis
- **User preferences**: Settings and configurations

### Privacy & Security
- No data is sent to external servers
- All processing happens locally
- User maintains full control of their data

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

### Documentation
- [User Guide](docs/user-guide.md)
- [API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- [GitHub Issues](https://github.com/prodeo5454/CarDiag/issues)
- [Discussions](https://github.com/prodeo5454/CarDiag/discussions)

### Contact
- For support: [Create an issue](https://github.com/prodeo5454/CarDiag/issues/new)
- For business inquiries: Use GitHub Discussions

## Roadmap

### Upcoming Features
- [ ] Cloud storage integration
- [ ] Mobile app development
- [ ] Advanced AI diagnostics
- [ ] Integration with service centers
- [ ] Expanded vehicle database
- [ ] Real-time collaboration features

### Version History
- **v2.0.0** - Complete rewrite with PWA capabilities and multi-vehicle support
- **v1.0.0** - Initial release with basic OBD-II diagnostics

## Acknowledgments

- **OBD-II Standards** - SAE International
- **Web Serial API** - Chromium Project
- **Next.js Team** - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Beautiful icon set

---

**CarDiag Pro** - Professional automotive diagnostics made simple.
