# Text-to-Speech Audio Player 🎧

## Overview

The **Text-to-Speech Audio Player** is a widget designed to leverage modern browser capabilities, specifically the Web Speech API, to transform textual content into an audible format. Its primary usage is to enhance accessibility by allowing users to listen to articles or summaries, making the web more inclusive for individuals with reading difficulties or visual impairments.

## Table of Contents

- [Setup and Integration](#setup-and-integration)
- [Technical Features](#technical-features)
- [Implementation](#implementation)
- [APIs and Dependencies](#apis-and-dependencies)
- [Tested Sites](#tested-sites)
- [Known Limitations](#known-limitations)
- [Feature Improvements](#feature-improvements)

## Setup and Integration

### Traditional Setup:

1. **Content Preparation**: Download the desired web page, ensuring any conflicting or unnecessary JavaScript is removed.
2. **Local Deployment**: Utilize the `http-server` npm package or similar tools to serve files from a local directory.
3. **Script Inclusion**: Simply integrate the provided JavaScript file into your HTML content just before the closing `</body>` tag.


### Chrome Extension Integration:

1. **Prepare Extension**: Package the widget's functionality into a basic Chrome extension using a manifest file.
2. **Install Extension**: Navigate to `chrome://extensions/`, enable "Developer mode", and load the widget's directory as an "unpacked" extension.
3. **Usage**: Upon successful installation, the extension will automatically run on allowed web pages, attaching the audio player functionality.

## Technical Features

- **Serverless Design**: Purely client-side execution, eliminating the need for backend infrastructure.

## Implementation

The widget makes use of semantic HTML elements to identify crucial pieces like article titles or summaries. This method allows for the effective conversion of selected text into speech.

At the onset, a variety of heuristic methods were explored. A shift was then made to evaluate a content density approach, as depicted in the paper CETD. However, this approach did not precisely serve the project's requirements. The eventual strategy revolved around title heuristics: pinpointing the title and subsequently extracting the principal content. This journey, filled with iterations and refinements, led to the formation of the current solution.


## APIs and Dependencies

- **Web Speech API**: The cornerstone of this widget, it enables the browser-centric text-to-speech capabilities.
  - [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#speech_synthesis)

## Tested Sites

The extension has been primarily tested on the following websites:

- [AVC](https://avc.com/) - Successful implementation.
- [Stacker](https://stacker.com/) - Successful implementation.
- [The Week (Archived Version)](https://web.archive.org/web/20201123000130/https://theweek.com/) - While mostly effective, the tool occasionally reads certain elements such as author names and "see all" buttons.


## Known Limitations


- **Unwanted Elements**: Current logic might occasionally misinterpret elements like "see all" buttons as pertinent content.
- **Complex Filtering**: The current codebase employs a multifaceted filtering mechanism, adding to its complexity and posing challenges for improvement.

## Author

- **Kostas Alexandropoulos** - [GitHub Profile](https://github.com/kostasalex)


## Feature Improvements

1. **Broad Compatibility**: Dedicated testing across diverse websites to cement the widget's versatility and reach.
2. **Codebase Evolution**: A pivotal focus is set on refining the codebase. The aim is to distill its complexity, making it more approachable for enhancements, especially in the domain of content filtering.
