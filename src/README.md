# BeatScroll

BeatScroll is a web application designed to provide an interactive audio experience through text input. This README provides instructions on how to set up and run the application, as well as how to configure the development environment.

## Project Structure

```
BeatScroll
├── src
│   └── index.html        # Main HTML file for the application
├── environment.yml       # Conda environment configuration
├── .gitignore            # Files and directories to ignore by Git
├── .gitattributes        # Git attributes for the repository
└── README.md             # Project documentation
```

## Running the Application

To run the BeatScroll application, follow these steps:

1. **Clone the repository:**

   ```
   git clone <repository-url>
   cd BeatScroll
   ```

2. **Set up the Conda environment:**

   ```
   conda env create -f environment.yml
   conda activate beatscroll
   ```

3. **Run the application:**
   - Open `src/index.html` in a web browser directly (double-click).
   - Alternatively, you can run a local HTTP server for consistent behavior:
     ```
     cd src
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser.

## Usage

- Type or paste text into the textarea.
- Press the keys `A`, `S`, `D`, `F`, `J`, `K`, `L`, `;`, or `Space` to interact with the audio features.
- Click the "Enable Audio" button to allow sound playback.

## Contributing

Contributions are welcome! Please keep changes small and self-contained. Add a short manual test plan to pull request descriptions since there are no automated tests yet.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
