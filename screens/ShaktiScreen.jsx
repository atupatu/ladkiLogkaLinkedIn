import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  Image
} from 'react-native';
import axios from 'axios';
import { Calendar } from 'react-native-calendars';
import { WebView } from 'react-native-webview';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Replace with your actual Gemini API key (use env variables in production)
const GEMINI_API_KEY = 'AIzaSyBXvKsteFoxYPAQjEr7itAcPaIxfHgF7PM';

export default function ShaktiScreen({ route, navigation }) {
  const { token } = route.params;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('roadmap');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [roadmapData, setRoadmapData] = useState(null);
  const [videoModal, setVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');

  // Sample skills list
  const availableSkills = [
    'JavaScript', 'React', 'Python', 'Data Science', 'Machine Learning',
    'UX Design', 'Public Speaking', 'Project Management', 'Leadership',
    'Digital Marketing', 'Content Creation', 'Graphic Design'
  ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://10.45.71.76:5000/api/users/me', {
          headers: { 'x-auth-token': token },
        });
        setUserData(response.data);
        
        if (response.data.skills && response.data.skills.length > 0) {
          setSelectedSkills(response.data.skills);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  // Generate learning roadmap using Gemini
  const generateRoadmap = async () => {
    if (selectedSkills.length === 0) {
      alert('Please select at least one skill to generate a roadmap');
      return;
    }

    setRoadmapLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `
        Create a detailed learning roadmap for the following skills: ${selectedSkills.join(', ')}.
        The roadmap should include:
        1. A title
        2. An overview
        3. 3-5 milestones with:
           - Title
           - Description
           - Duration
           - Resources (mix of videos, articles, practice exercises with titles, URLs, and descriptions)
           - Completion date (starting from today: ${new Date().toISOString().split('T')[0]})
        Format the response as a JSON object.
        Personalize it based on this user data: ${JSON.stringify(userData)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const roadmapText = response.text();

      const cleanedRoadmapText = roadmapText
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      
      const generatedRoadmap = JSON.parse(cleanedRoadmapText);
      setRoadmapData(generatedRoadmap);

      const dates = {};
      generatedRoadmap.milestones.forEach((milestone, index) => {
        dates[milestone.completionDate] = {
          selected: true,
          marked: true,
          dotColor: '#d94c86',
          customStyles: {
            container: {
              backgroundColor: '#fde7ef'
            },
            text: {
              color: '#d94c86',
              fontWeight: 'bold'
            }
          }
        };
      });
      
      setMarkedDates(dates);

    } catch (error) {
      console.error('Error generating roadmap with Gemini:', error);
      alert('Failed to generate roadmap. Using fallback data.');
      
      const mockRoadmapData = {
        title: `Your Learning Path: ${selectedSkills.join(', ')}`,
        overview: `This personalized roadmap will help you master ${selectedSkills.join(', ')} through a structured learning approach tailored to your profile and goals.`,
        milestones: [
          {
            id: 1,
            title: 'Foundation Building',
            description: 'Master the core concepts and fundamentals',
            duration: '3 weeks',
            resources: [
              { 
                type: 'video', 
                title: 'Introduction to Key Concepts', 
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://i.imgur.com/placeholder.png' 
              },
              { 
                type: 'article', 
                title: 'Understanding the Basics', 
                url: 'https://medium.com/article/basics' 
              },
              { 
                type: 'practice', 
                title: 'Complete the Foundations Quiz', 
                description: 'Test your understanding of core concepts' 
              }
            ],
            completionDate: '2025-04-15'
          },
          {
            id: 2,
            title: 'Skill Application',
            description: 'Apply your knowledge through practical exercises',
            duration: '4 weeks',
            resources: [
              { 
                type: 'video', 
                title: 'Practical Applications', 
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://i.imgur.com/placeholder.png' 
              },
              { 
                type: 'project', 
                title: 'Build a Sample Project', 
                description: 'Create something using your new skills' 
              }
            ],
            completionDate: '2025-05-15'
          }
        ]
      };
      setRoadmapData(mockRoadmapData);
    } finally {
      setRoadmapLoading(false);
    }
  };

  const addSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, { id: Date.now().toString(), text: newGoal, completed: false }]);
      setNewGoal('');
    }
  };

  const toggleGoalCompletion = (id) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const openVideo = (video) => {
    setCurrentVideo(video);
    setVideoModal(true);
  };

  const renderSkillBadge = ({ item }) => (
    <View style={styles.skillBadgeContainer}>
      <View style={styles.skillBadge}>
        <Text style={styles.skillText}>{item}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeSkillButton}
        onPress={() => removeSkill(item)}
      >
        <Text style={styles.removeSkillButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResourceItem = (resource, index) => (
    <View key={index} style={styles.resourceItem}>
      {resource.type === 'video' && (
        <>
          <TouchableOpacity 
            style={styles.videoThumbnail}
            onPress={() => openVideo(resource)}
          >
            <Image 
              source={{ uri: resource.thumbnailUrl || 'https://i.imgur.com/placeholder.png' }}
              style={styles.thumbnailImage}
            />
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.resourceTitle}>{resource.title}</Text>
        </>
      )}
      
      {resource.type === 'article' && (
        <>
          <View style={styles.articleIcon}>
            <Text style={styles.articleIconText}>📄</Text>
          </View>
          <Text style={styles.resourceTitle}>{resource.title}</Text>
        </>
      )}
      
      {(resource.type === 'practice' || resource.type === 'project' || resource.type === 'community') && (
        <>
          <View style={[styles.articleIcon, 
            resource.type === 'practice' ? styles.practiceIcon : 
            resource.type === 'project' ? styles.projectIcon : styles.communityIcon
          ]}>
            <Text style={styles.articleIconText}>
              {resource.type === 'practice' ? '✏️' : 
               resource.type === 'project' ? '🛠️' : '👥'}
            </Text>
          </View>
          <Text style={styles.resourceTitle}>{resource.title}</Text>
          <Text style={styles.resourceDescription}>{resource.description}</Text>
        </>
      )}
    </View>
  );

  const renderRoadmapResponse = () => {
    if (!roadmapData) return null;
    
    return (
      <View style={styles.responseContainer}>
        <Text style={styles.responseTitle}>Generated Roadmap Response:</Text>
        <ScrollView style={styles.responseContent}>
          <Text style={styles.responseText}>
            {JSON.stringify(roadmapData, null, 2)}
          </Text>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#d94c86" />
          <Text style={styles.loaderText}>Loading Shakti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shakti</Text>
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'roadmap' && styles.activeTab]}
          onPress={() => setActiveTab('roadmap')}
        >
          <Text style={[styles.tabText, activeTab === 'roadmap' && styles.activeTabText]}>Roadmap</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Calendar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
          onPress={() => setActiveTab('goals')}
        >
          <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>Goals</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'roadmap' && (
          <View style={styles.roadmapContainer}>
            <Text style={styles.sectionTitle}>Your Learning Journey</Text>
            <Text style={styles.sectionDescription}>
              Shakti uses AI to create a personalized learning roadmap based on your skills and goals.
            </Text>
            
            <View style={styles.skillSelectionContainer}>
              <Text style={styles.skillSelectionTitle}>Select your skills and interests:</Text>
              
              {selectedSkills.length > 0 && (
                <FlatList
                  data={selectedSkills}
                  renderItem={renderSkillBadge}
                  keyExtractor={(item) => item}
                  horizontal
                  style={styles.selectedSkillsList}
                  showsHorizontalScrollIndicator={false}
                />
              )}
              
              <View style={styles.skillInputContainer}>
                <TextInput
                  style={styles.skillInput}
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChangeText={setSkillInput}
                />
                <TouchableOpacity 
                  style={styles.addSkillButton}
                  onPress={() => addSkill(skillInput)}
                  disabled={!skillInput.trim()}
                >
                  <Text style={styles.addSkillButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.suggestedSkillsTitle}>Suggested skills:</Text>
              <View style={styles.suggestedSkillsContainer}>
                {availableSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.suggestedSkillBadge,
                      selectedSkills.includes(skill) && styles.selectedSuggestedSkill
                    ]}
                    onPress={() => {
                      if (selectedSkills.includes(skill)) {
                        removeSkill(skill);
                      } else {
                        addSkill(skill);
                      }
                    }}
                  >
                    <Text style={[
                      styles.suggestedSkillText,
                      selectedSkills.includes(skill) && styles.selectedSuggestedSkillText
                    ]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.generateButton, selectedSkills.length === 0 && styles.disabledButton]}
                onPress={generateRoadmap}
                disabled={selectedSkills.length === 0 || roadmapLoading}
              >
                {roadmapLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate My Learning Roadmap</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {renderRoadmapResponse()}
            
            {roadmapData && (
              <View style={styles.roadmapResults}>
                <Text style={styles.roadmapTitle}>{roadmapData.title}</Text>
                <Text style={styles.roadmapOverview}>{roadmapData.overview}</Text>
                
                {roadmapData.milestones.map((milestone, index) => (
                  <View key={milestone.id || index} style={styles.milestone}>
                    <View style={styles.milestoneHeader}>
                      <View style={styles.milestoneNumber}>
                        <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.milestoneTitleContainer}>
                        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                        <Text style={styles.milestoneDuration}>{milestone.duration}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                    
                    <View style={styles.resourcesContainer}>
                      <Text style={styles.resourcesTitle}>Learning Resources:</Text>
                      {milestone.resources.map((resource, resourceIndex) => 
                        renderResourceItem(resource, resourceIndex)
                      )}
                    </View>
                    
                    <View style={styles.completionDateContainer}>
                      <Text style={styles.completionDateLabel}>Target Completion:</Text>
                      <Text style={styles.completionDate}>{milestone.completionDate}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'calendar' && (
          <View style={styles.calendarContainer}>
            <Text style={styles.sectionTitle}>Learning Schedule</Text>
            <Text style={styles.sectionDescription}>
              Track your learning milestones and scheduled tasks.
            </Text>
            
            <Calendar
              style={styles.calendar}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#d94c86',
                selectedDayBackgroundColor: '#d94c86',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#d94c86',
                dayTextColor: '#333333',
                textDisabledColor: '#d9e1e8',
                dotColor: '#d94c86',
                selectedDotColor: '#ffffff',
                arrowColor: '#d94c86',
                monthTextColor: '#333333',
                indicatorColor: '#d94c86',
              }}
              markedDates={markedDates}
            />
            
            <View style={styles.upcomingContainer}>
              <Text style={styles.upcomingTitle}>Upcoming Milestones</Text>
              
              {roadmapData ? (
                roadmapData.milestones.map((milestone) => (
                  <View key={milestone.id || milestone.title} style={styles.upcomingItem}>
                    <View style={styles.upcomingDateCircle}>
                      <Text style={styles.upcomingDateText}>
                        {milestone.completionDate.split('-')[2]}
                      </Text>
                      <Text style={styles.upcomingMonthText}>
                        {new Date(milestone.completionDate).toLocaleString('default', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.upcomingDetails}>
                      <Text style={styles.upcomingItemTitle}>{milestone.title}</Text>
                      <Text style={styles.upcomingItemDescription}>
                        Complete milestone: {milestone.description}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noContentText}>
                  Generate a roadmap to see your learning schedule
                </Text>
              )}
            </View>
          </View>
        )}
        
        {activeTab === 'goals' && (
          <View style={styles.goalsContainer}>
            <Text style={styles.sectionTitle}>Learning Goals</Text>
            <Text style={styles.sectionDescription}>
              Set and track personal goals to enhance your learning journey.
            </Text>
            
            <View style={styles.addGoalContainer}>
              <TextInput
                style={styles.goalInput}
                placeholder="Add a new goal..."
                value={newGoal}
                onChangeText={setNewGoal}
              />
              <TouchableOpacity 
                style={styles.addGoalButton}
                onPress={addGoal}
                disabled={!newGoal.trim()}
              >
                <Text style={styles.addGoalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.goalsList}>
              {goals.length > 0 ? (
                goals.map((goal) => (
                  <TouchableOpacity 
                    key={goal.id} 
                    style={styles.goalItem}
                    onPress={() => toggleGoalCompletion(goal.id)}
                  >
                    <View style={[styles.goalCheckbox, goal.completed && styles.goalCheckboxCompleted]}>
                      {goal.completed && <Text style={styles.goalCheckboxText}>✓</Text>}
                    </View>
                    <Text style={[styles.goalText, goal.completed && styles.goalTextCompleted]}>
                      {goal.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noContentText}>
                  Add goals to track your learning progress
                </Text>
              )}
            </View>
            
            {roadmapData && (
              <View style={styles.suggestedGoalsContainer}>
                <Text style={styles.suggestedGoalsTitle}>Suggested Goals:</Text>
                {roadmapData.milestones.map((milestone) => (
                  <TouchableOpacity 
                    key={milestone.id || milestone.title} 
                    style={styles.suggestedGoalItem}
                    onPress={() => {
                      setNewGoal(`Complete milestone: ${milestone.title}`);
                    }}
                  >
                    <Text style={styles.suggestedGoalText}>
                      Complete milestone: {milestone.title}
                    </Text>
                    <Text style={styles.suggestedGoalAdd}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      <Modal
        visible={videoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVideoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.videoContainer}>
              <WebView
                javaScriptEnabled={true}
                source={{ uri: currentVideo?.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ' }}
                style={styles.webView}
              />
            </View>
            <Text style={styles.videoTitle}>{currentVideo?.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setVideoModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#d94c86',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#d94c86',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  activeTabText: {
    color: '#d94c86',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  roadmapContainer: {
    padding: 20,
  },
  skillSelectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  skillSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  selectedSkillsList: {
    marginBottom: 12,
  },
  skillBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  skillBadge: {
    backgroundColor: '#fde7ef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 14,
    color: '#d94c86',
    fontWeight: '500',
  },
  removeSkillButton: {
    marginLeft: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d94c86',
  },
  removeSkillButtonText: {
    fontSize: 16,
    color: '#d94c86',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  skillInputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  skillInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333333',
  },
  addSkillButton: {
    backgroundColor: '#d94c86',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSkillButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestedSkillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  suggestedSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  suggestedSkillBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSuggestedSkill: {
    backgroundColor: '#fde7ef',
  },
  suggestedSkillText: {
    fontSize: 13,
    color: '#666666',
  },
  selectedSuggestedSkillText: {
    color: '#d94c86',
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: '#d94c86',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  responseContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  responseContent: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 4,
    padding: 10,
  },
  responseText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  roadmapResults: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roadmapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  roadmapOverview: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  milestone: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestoneNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d94c86',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  milestoneNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneTitleContainer: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  milestoneDuration: {
    fontSize: 13,
    color: '#666666',
    marginTop: 3,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 15,
  },
  resourcesContainer: {
    marginBottom: 15,
  },
  resourcesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  resourceItem: {
    marginBottom: 12,
  },
  videoThumbnail: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 30,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    color: '#666666',
  },
  articleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  practiceIcon: {
    backgroundColor: '#e8f4ff',
  },
  projectIcon: {
    backgroundColor: '#fff4e8',
  },
  communityIcon: {
    backgroundColor: '#edfff0',
  },
  articleIconText: {
    fontSize: 16,
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionDateLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 8,
  },
  completionDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d94c86',
  },
  calendarContainer: {
    padding: 20,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  upcomingDateCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fde7ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  upcomingDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d94c86',
  },
  upcomingMonthText: {
    fontSize: 12,
    color: '#d94c86',
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  upcomingItemDescription: {
    fontSize: 14,
    color: '#666666',
  },
  noContentText: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  goalsContainer: {
    padding: 20,
  },
  addGoalContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  goalInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  addGoalButton: {
    backgroundColor: '#d94c86',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addGoalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  goalsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  goalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d94c86',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckboxCompleted: {
    backgroundColor: '#d94c86',
  },
  goalCheckboxText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  goalTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  suggestedGoalsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  suggestedGoalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  suggestedGoalText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  suggestedGoalAdd: {
    fontSize: 18,
    color: '#d94c86',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  videoContainer: {
    height: 200,
    marginBottom: 15,
  },
  webView: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#d94c86',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});