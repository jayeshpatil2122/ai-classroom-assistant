import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// 🔴 CHANGE THIS LINK BELOW TO YOUR OWN VERCEL URL 🔴
// It should look like: "https://ai-classroom-test-jayesh.vercel.app/api/brain"
const BACKEND_URL = "https://ai-classroom-test-two.vercel.app/api/brain";

export default function App() {
  const [recording, setRecording] = useState();
  const [answer, setAnswer] = useState("Press 'Start' to listen...");
  const [loading, setLoading] = useState(false);
  const [isQuestion, setIsQuestion] = useState(false);

  // 1. Start Recording
  async function startRecording() {
    try {
      setAnswer("Listening to the teacher...");
      setIsQuestion(false);
      
      // Request permission
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync( 
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
      setAnswer("Error: Could not access microphone.");
    }
  }

  // 2. Stop Recording & Send to AI
 // Replace your old stopRecording function with this new one
  async function stopRecording() {
    setLoading(true);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    
    // Convert to base64
    const base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    setAnswer("Analyzing with Gemini...");

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64Audio }),
      });

      const data = await response.json();
      
      // --- NEW CLEANING LOGIC START ---
      let aiText = data.result;

      // 1. Remove the ```json and ``` marks if they exist
      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        // 2. Try to parse it into a real object
        const parsed = JSON.parse(aiText);
        
        if (parsed.isQuestion) {
          // 3. If it's a question, make it look nice!
          setIsQuestion(true);
          setAnswer(`❓ QUESTION:\n${parsed.question}\n\n💡 ANSWER:\n${parsed.answer}`);
        } else {
          // If it's just a summary
          setIsQuestion(false);
          setAnswer(`📝 SUMMARY:\n${parsed.summary}`);
        }
      } catch {
        // If parsing fails (AI didn't give perfect JSON), just show raw text
        setAnswer(aiText);
      }
      // --- NEW CLEANING LOGIC END ---
      
    } catch (error) {
      setAnswer("Error: " + error.message);
    }
    setLoading(false);
  }

  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>🎓 Class Assistant</Text>
      
      <View style={[styles.card, isQuestion ? styles.activeCard : null]}>
        <ScrollView>
          <Text style={styles.output}>{answer}</Text>
        </ScrollView>
      </View>

      <View style={styles.controls}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" />
        ) : (
          <TouchableOpacity 
            style={[styles.button, recording ? styles.stopBtn : styles.startBtn]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.btnText}>
              {recording ? "⏹ Stop & Ask" : "🎙 Start Listening"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 40,
    marginBottom: 30,
  },
  card: {
    width: '100%',
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  output: {
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
  },
  controls: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startBtn: {
    backgroundColor: '#4F46E5', // Indigo
  },
  stopBtn: {
    backgroundColor: '#EF4444', // Red
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});