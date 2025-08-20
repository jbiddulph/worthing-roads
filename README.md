# 🚗 Worthing Roads Knowledge Quiz

A comprehensive interactive quiz application that tests your knowledge of Worthing's road network and junctions. Built with Next.js, featuring two parts with over 640 unique questions about local road knowledge.

## ✨ Features

- **Two-Part Quiz System**: 
  - **Part 1**: 540+ questions from the original road network
  - **Part 2**: 100+ additional advanced questions
- **Interactive Quiz Interface**: Multiple choice questions with immediate feedback
- **Timer & Scoring**: Track your performance and completion time
- **Confetti Celebration**: Festive animations when completing quizzes
- **Detailed Results**: Comprehensive summary of all questions and answers
- **Responsive Design**: Works on desktop and mobile devices

## 🎯 Quiz Format

Each question follows the format: **"What road junctions off [Main Road]?"**

- **Question Example**: "What road junctions off Heene Way?"
- **Correct Answer**: One of the smaller roads that junctions off the main road
- **Options**: 4 multiple choice answers (1 correct + 3 distractors)
- **Explanation**: Clear explanation of the correct junction relationship

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.0 with React
- **Styling**: Tailwind CSS
- **Animations**: Canvas Confetti
- **Data**: JSON-based question system
- **Deployment**: Ready for Vercel/Netlify deployment

## 📁 Project Structure

```
worthing-roads/
├── src/
│   ├── app/
│   │   └── page.tsx          # Main application entry point
│   └── components/
│       ├── QuizSelector.tsx   # Quiz part selection interface
│       ├── RoadQuiz.tsx       # Part 1 quiz component
│       └── RoadQuizPart2.tsx  # Part 2 quiz component
├── public/
│   ├── roads.json            # Complete list of Worthing roads
│   ├── junctions.json        # Part 1 junction data (540+ questions)
│   └── junctions_part2.json  # Part 2 junction data (100+ questions)
├── data/
│   └── roads.json            # Source road data
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jbiddulph/worthing-roads.git
   cd worthing-roads
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

## 🎮 How to Play

1. **Choose Your Quiz**: Select between Part 1 or Part 2
2. **Answer Questions**: Click on the correct road that junctions off the main road
3. **Get Feedback**: Immediate feedback on correct/incorrect answers
4. **Track Progress**: Monitor your score and time
5. **Complete Quiz**: Finish all questions to see your final results
6. **Celebrate**: Enjoy confetti animations upon completion!

## 📊 Quiz Statistics

- **Total Questions**: 640+ across both parts
- **Question Types**: Road junction knowledge
- **Difficulty**: Progressive from basic to advanced
- **Time Tracking**: Built-in timer for performance measurement
- **Scoring**: Percentage-based scoring system

## 🔧 Customization

### Adding New Questions

To add new questions, edit the junction files:

```json
{
  "Main Road Name": ["Smaller Road 1", "Smaller Road 2"]
}
```

### Modifying Quiz Logic

The quiz components are fully customizable:
- Question generation algorithms
- Distractor selection logic
- UI styling and animations
- Scoring mechanisms

## 🌟 Road Data Sources

The quiz uses real road data from Worthing, including:
- Main arterial roads
- Residential streets
- Industrial areas
- Coastal routes
- Historical road names

## 📱 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. Custom domain support available

### Netlify

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Add new road junction questions
- Improve the quiz interface
- Enhance the scoring system
- Add new features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Worthing Borough Council for road network information
- Next.js team for the excellent framework
- Open source community for various libraries and tools

## 📞 Support

If you have questions or need help:
- Open an issue on GitHub
- Check the documentation
- Review the code examples

---

**Happy Quizzing! 🎉 Test your Worthing road knowledge today!**
