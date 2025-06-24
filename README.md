# Command Connector Compatibility Calculator - Lite

## Overview

The Command Connector Compatibility Calculator - Lite is a comprehensive web application designed to analyze camera inventory data against Verkada's Command Connector Hardware Compatibility List. This tool streamlines the process of determining which existing security cameras in your infrastructure are compatible with Verkada's Command Connector platform, enabling seamless integration planning and migration strategies.

**Target Users:**
- Security system integrators
- IT administrators managing camera infrastructure
- Verkada partners and resellers
- Organizations planning security system migrations

**Key Benefits:**
- Automated compatibility analysis of large camera inventories
- Data cleaning and preprocessing to improve match accuracy
- Enhanced camera specifications through third-party database integration
- Export capabilities for modified camera configurations
- Dark/light theme support for improved user experience

<!-- Screenshot Placeholder: Main Application Interface -->
*[Screenshot: Main application interface showing the three-step process]*

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Usage](#usage)
- [File Format Support](#file-format-support)
- [Data Processing](#data-processing)
- [Export Functionality](#export-functionality)
- [Contributing](#contributing)
- [License](#license)

## Features

### 📊 **Multi-Format File Upload**
- Support for CSV, Excel (.xlsx, .xls), OpenDocument (.ods), and Numbers (.numbers) files
- Drag-and-drop interface with progress tracking
- File validation and error handling
- Maximum file size: 25MB

### 🔍 **Intelligent Data Analysis**
- **Exact Matching**: Direct matches against Verkada's compatibility database
- **Potential Matching**: Similarity-based matching with confidence scoring
- **Data Cleaning**: Automatic removal of IP addresses, MAC addresses, dates, and common words
- **Third-Party Enhancement**: Cross-referencing with additional camera specification database

### 📋 **Interactive Data Preview**
- Column selection interface with keyboard shortcuts
- Sortable data tables with pagination
- Real-time data validation and error feedback
- Responsive design for various screen sizes

### ⚙️ **Camera Management System**
- **Match Status Tracking**: Exact, Potential, Identified, Declined, Modified, None
- **Inline Editing**: Modify camera specifications directly in the interface
- **Approval Workflow**: Review and approve/decline potential matches
- **Enhanced Details**: Additional camera specifications from third-party database

### 📤 **Export Capabilities**
- CSV export of complete analysis results
- YAML export of modified camera entries
- Maintains compatibility database format structure
- Validation and error handling for export data

### 🎨 **User Experience**
- Dark/light theme toggle with system preference detection
- Responsive design for desktop and mobile devices
- Progress indicators and loading states
- Comprehensive error messaging and validation

<!-- Screenshot Placeholder: File Upload Interface -->
*[Screenshot: File upload interface with drag-and-drop functionality]*

## Technologies Used

### **Frontend:**
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with comprehensive interfaces
- **Tailwind CSS** - Utility-first CSS framework with dark mode support
- **Lucide React** - Beautiful, customizable SVG icons

### **Data Processing:**
- **XLSX** - Excel file parsing and processing
- **js-yaml** - YAML parsing and generation for database operations
- **Custom Algorithms** - Levenshtein distance for similarity matching

### **Build Tools:**
- **Vite** - Fast build tool and development server
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing with Autoprefixer

### **Additional Tools:**
- **GitHub Pages** - Static site hosting and deployment
- **TypeScript Strict Mode** - Enhanced type checking and validation

<!-- Screenshot Placeholder: Data Preview Interface -->
*[Screenshot: Data preview and column selection interface]*

## Usage

### **Step 1: File Upload**
1. Navigate to the application homepage
2. Drag and drop your camera inventory file or click to browse
3. Supported formats: CSV, Excel (.xlsx, .xls), OpenDocument (.ods), Numbers (.numbers)
4. Wait for file validation and upload completion

### **Step 2: Data Preview & Column Selection**
1. Review your uploaded data in the interactive table
2. **Select Model Column** (Required): Click column headers to designate the camera model column
3. **Select Count Column** (Optional): Cmd/Ctrl+Click to designate quantity/count column
4. Use keyboard shortcuts for efficient navigation:
   - **Arrow keys**: Navigate between columns
   - **Space/Enter**: Select model column
   - **C key**: Select count column
   - **Double-click**: Sort column data

### **Step 3: Analysis Results**
1. Review compatibility analysis results with detailed match types
2. **Handle Potential Matches**: Approve or decline suggested matches
3. **Edit Camera Details**: Modify specifications for any camera entry
4. **Export Results**: Download CSV analysis report or YAML configuration file

<!-- Screenshot Placeholder: Analysis Results -->
*[Screenshot: Analysis results showing different match types and statistics]*

### **Match Types Explained**

- **🟢 Exact**: Direct match found in Verkada compatibility database
- **🟡 Potential**: Similarity-based match requiring user approval
- **🔵 Identified**: User-approved potential match
- **🟠 Declined**: User-declined potential match  
- **🟣 Modified**: User-edited camera specifications
- **🔴 None**: No compatibility match found
- **👁️ Observed**: Enhanced with third-party camera database information

### **Configuration Options**

#### **Data Cleaning Settings**
The application automatically filters out:
- IP addresses (IPv4 and IPv6)
- MAC addresses
- Date patterns (various formats)
- Common English words
- Manufacturer names (to improve model matching)

#### **Similarity Matching**
- Minimum similarity threshold: 60%
- Uses Levenshtein distance algorithm
- Considers subset matching for improved accuracy

<!-- Screenshot Placeholder: Camera Edit Form -->
*[Screenshot: Camera editing interface with form fields]*

## File Format Support

### **Supported Input Formats**
| Format | Extension | Notes |
|--------|-----------|-------|
| CSV | `.csv` | Comma-separated values with proper quote handling |
| Excel | `.xlsx`, `.xls` | Microsoft Excel workbooks (first sheet used) |
| OpenDocument | `.ods` | LibreOffice/OpenOffice spreadsheets |
| Numbers | `.numbers` | Apple Numbers spreadsheets |

### **Data Requirements**
- **Headers Required**: First row must contain column headers
- **Model Column**: Must contain camera model names/numbers
- **Count Column**: Optional numeric values for quantity aggregation
- **Maximum File Size**: 25MB
- **Encoding**: UTF-8 recommended for special characters

## Data Processing

### **Cleaning Pipeline**
1. **Token Extraction**: Split model names into individual components
2. **Pattern Filtering**: Remove IP addresses, MAC addresses, dates
3. **Word Filtering**: Remove common English words and manufacturer names
4. **Normalization**: Standardize spacing and formatting

### **Matching Algorithm**
1. **Exact Matching**: Direct string comparison after cleaning
2. **Similarity Scoring**: Levenshtein distance calculation
3. **Subset Detection**: Check for partial string matches
4. **Threshold Application**: Filter matches above 60% similarity

### **Third-Party Enhancement**
- Cross-references camera models against additional specification database
- Provides resolution, channel count, and protocol information
- Enhances both matched and unmatched cameras when possible

<!-- Screenshot Placeholder: Export Interface -->
*[Screenshot: Export functionality and file download options]*

## Export Functionality

### **CSV Analysis Report**
Comprehensive report including:
- Original camera model names
- Device counts and percentages
- Match types and compatibility status
- Verkada compatible model names
- Integration protocols (ONVIF-S/RTSP)
- Firmware requirements and notes
- Third-party enhancement status

### **YAML Configuration Export**
Exports only **Modified** camera entries in database format:
```yaml
- model: "Camera-Model-Name"
  manufacturer: "Manufacturer Name"
  resolution_mp: 2.0
  channel_count: 1
  aliases:
    - "Alternative-Model-Name"
  protocols:
    onvif-s: true
    rtsp: true
```

### **Export Validation**
- Ensures required fields are present
- Validates data types and formats
- Provides warnings for potential issues
- Prevents export of incomplete entries

## Contributing

We welcome contributions to improve the Command Connector Compatibility Calculator - Lite! Here's how you can help:

### **Development Setup**
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/4C-Lite.git
   cd 4C-Lite
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

### **Contribution Guidelines**
1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following the existing code style
3. **Test thoroughly** across different browsers and file formats
4. **Commit your changes** with descriptive messages:
   ```bash
   git commit -m "Add: New feature description"
   ```
5. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** with detailed description of changes

### **Areas for Contribution**
- Additional file format support
- Enhanced matching algorithms
- UI/UX improvements
- Performance optimizations
- Documentation updates
- Bug fixes and error handling

### **Code Style**
- Use TypeScript for type safety
- Follow React functional component patterns
- Maintain responsive design principles
- Include comprehensive error handling
- Write descriptive comments for complex logic

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### **Third-Party Licenses**
- React: MIT License
- Tailwind CSS: MIT License
- Lucide React: ISC License
- XLSX: Apache License 2.0
- js-yaml: MIT License

---

## Support & Contact

For questions, issues, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/not-mehul/4C-Lite/issues)
- **Documentation**: [Project Wiki](https://github.com/not-mehul/4C-Lite/wiki)
- **Website**: [https://paradoxicalbit.com](https://paradoxicalbit.com)

### **Frequently Asked Questions**

**Q: What file formats are supported?**
A: CSV, Excel (.xlsx, .xls), OpenDocument (.ods), and Apple Numbers (.numbers) files up to 25MB.

**Q: How accurate is the compatibility matching?**
A: Exact matches are 100% accurate. Potential matches use similarity algorithms with a 60% minimum threshold and require user approval.

**Q: Can I export my analysis results?**
A: Yes, you can export complete analysis results as CSV or export modified camera configurations as YAML files.

**Q: Is my data secure?**
A: All processing happens locally in your browser. No data is uploaded to external servers.

**Q: Can I use this tool offline?**
A: The application requires an initial internet connection to load, but file processing happens entirely in your browser.

---

*Last updated: [Current Date]*
*Version: 1.0.0*