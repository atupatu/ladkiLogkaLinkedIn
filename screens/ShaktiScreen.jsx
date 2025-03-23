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
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { WebView } from 'react-native-webview';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const screenWidth = Dimensions.get('window').width;

export default function RoadmapGenerator({ route, navigation }) {
  const { token } = route.params;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [roadmapData, setRoadmapData] = useState(null);
  const [videoModal, setVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [progressData, setProgressData] = useState([]);
  const [skillsChartData, setSkillsChartData] = useState([]);
  const [taskModal, setTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateTaskText, setDateTaskText] = useState('');
  const [checkpoints, setCheckpoints] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);

  // Pick resume file
  const pickResume = async () => {
    try {
      console.log('Picking resume file');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      console.log('Picked file result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeFile(file);
        await uploadResume(file);
      } else {
        console.log('File picking canceled or no assets found');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert('Failed to pick resume. Please try again.');
    }
  };

  // Upload resume and process it
  const uploadResume = async (file) => {
    console.log('Uploading resume', file);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name || 'resume.pdf',
        type: file.mimeType || 'application/pdf',
      });

      const response = await fetch('http://10.45.71.76:5000/api/profile/resume', {
        method: 'POST',
        headers: {
          'x-auth-token': token,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Server response:', data);

      await processUserData(data);
      setActiveTab('roadmap');
      setLoading(false);
      return data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Using sample data.');

      const sampleUserData = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          skills: [
            { skill: 'Tailoring', proficiencyLevel: 75 },
            { skill: 'Entrepreneurship', proficiencyLevel: 60 },
            { skill: 'Communication', proficiencyLevel: 85 },
            { skill: 'Financial Literacy', proficiencyLevel: 45 },
            { skill: 'Leadership', proficiencyLevel: 70 },
            { skill: 'Digital Skills', proficiencyLevel: 55 },
          ],
        },
        roadmap: [
          {
            skill: 'Tailoring',
            description: 'Master sewing techniques',
            startDate: '2025-03-22T00:00:00.000Z',
            endDate: '2025-04-05T00:00:00.000Z',
            priority: 3,
            score: 75,
          },
          {
            skill: 'Entrepreneurship',
            description: 'Learn business basics',
            startDate: '2025-04-05T00:00:00.000Z',
            endDate: '2025-04-19T00:00:00.000Z',
            priority: 2,
            score: 60,
          },
          {
            skill: 'Leadership',
            description: 'Develop leadership skills',
            startDate: '2025-04-19T00:00:00.000Z',
            endDate: '2025-05-03T00:00:00.000Z',
            priority: 1,
            score: 70,
          },
        ],
      };

      await processUserData(sampleUserData);
      setActiveTab('roadmap');
      setLoading(false);
    }
  };

  // Process the server response
  const processUserData = async (data) => {
    setUserData(data.user);
    const milestones = data.roadmap.map((item, index) => ({
      id: index + 1,
      title: `${item.skill} Development`,
      description: item.description,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: new Date(item.endDate).toISOString().split('T')[0],
      progress: Math.round(item.score * 0.5),
      checkpoints: generateCheckpoints(item),
      resources: getResourcesForSkill(item.skill),
    }));
  
    setRoadmapData({
      title: `Empowerment Learning Journey for ${data.user.name}`,
      overview: `This roadmap enhances your skills in ${data.roadmap.map(r => r.skill).join(', ')}.`,
      milestones,
    });
  
    // Process skills for chart with validation
    if (data.user.skills && Array.isArray(data.user.skills) && data.user.skills.length > 0) {
      const filteredSkills = data.user.skills
        .filter(skill => skill && typeof skill.proficiencyLevel === 'number' && skill.proficiencyLevel > 0)
        .sort((a, b) => b.proficiencyLevel - a.proficiencyLevel)
        .slice(0, 6);
  
      if (filteredSkills.length > 0) {
        setSkillsChartData({
          labels: filteredSkills.map(s => s.skill || 'Unknown'),
          datasets: [{ data: filteredSkills.map(s => s.proficiencyLevel) }],
        });
      } else {
        console.warn('No valid skills data for chart');
        setSkillsChartData({ labels: [], datasets: [{ data: [] }] });
      }
    } else {
      console.warn('Skills data missing or invalid');
      setSkillsChartData({ labels: [], datasets: [{ data: [] }] });
    }
  
    // Set checkpoints and marked dates
    const allCheckpoints = milestones.flatMap(m => m.checkpoints.map(cp => ({
      ...cp,
      milestoneTitle: m.title,
    })));
    setCheckpoints(allCheckpoints);
  
    const dates = {};
    allCheckpoints.forEach(cp => {
      dates[cp.date] = {
        selected: true,
        marked: true,
        dotColor: cp.completed ? '#4CAF50' : '#FF5722',
        customStyles: {
          container: { backgroundColor: cp.completed ? '#E8F5E9' : '#FFF3E0' },
          text: { color: cp.completed ? '#2E7D32' : '#E64A19', fontWeight: 'bold' },
        },
      };
    });
    setMarkedDates(dates);
  
    // Generate progress data with validation
    const progressDays = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - 13 + i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const progress = Math.floor(Math.random() * 40) + i * 4;
      progressDays.push({
        day: dateStr,
        progress: Number.isFinite(progress) ? progress : 0, // Ensure numeric
        hours: (Math.random() * 3 + 0.5).toFixed(1),
      });
    }
    setProgressData(progressDays.length > 0 ? progressDays : [{ day: 'N/A', progress: 0 }]);
  };
  // Generate checkpoints for each roadmap item
  const generateCheckpoints = (roadmapItem) => {
    const checkpoints = [];
    const startDate = new Date(roadmapItem.startDate);
    const endDate = new Date(roadmapItem.endDate);
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const interval = Math.floor(daysDiff / 3);

    for (let i = 0; i < 3; i++) {
      const checkpointDate = new Date(startDate);
      checkpointDate.setDate(startDate.getDate() + i * interval);
      checkpoints.push({
        id: `${roadmapItem.skill}-${i + 1}`,
        title: `${roadmapItem.skill} Checkpoint ${i + 1}`,
        date: checkpointDate.toISOString().split('T')[0],
        completed: i === 0 && roadmapItem.score > 50, // Example logic
      });
    }
    return checkpoints;
  };

  // Define resources for skills
  const getResourcesForSkill = (skill) => {
    const resources = {
      'Web Development': [
        { type: 'video', title: 'HTML & CSS Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
        { type: 'article', title: 'JavaScript Guide', url: 'https://example.com/js-guide' },
      ],
      'Machine Learning': [
        { type: 'video', title: 'ML Fundamentals', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
        { type: 'article', title: 'ML Algorithms', url: 'https://example.com/ml-algorithms' },
      ],
      'Project Management': [
        { type: 'video', title: 'Agile Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
        { type: 'practice', title: 'Plan a Project', description: 'Draft a project timeline' },
      ],
      'Tailoring': [
        { type: 'video', title: 'Sewing Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
        { type: 'article', title: 'Tailoring Guide', url: 'https://example.com/tailoring' },
      ],
      'Entrepreneurship': [
        { type: 'video', title: 'Entrepreneurship 101', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
        { type: 'practice', title: 'Business Plan', description: 'Draft your first business plan' },
      ],
      'Leadership': [
        { type: 'video', title: 'Leadership Skills', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
        { type: 'article', title: 'Leadership Guide', url: 'https://example.com/leadership' },
      ],
    };
    return resources[skill] || [
      { type: 'video', title: `Introduction to ${skill}`, url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnailUrl: 'https://i.imgur.com/placeholder.png' },
      { type: 'article', title: `${skill} Guide`, url: 'https://example.com/generic-guide' },
    ];
  };

  // Toggle checkpoint completion
  const toggleCheckpointCompletion = (checkpointId) => {
    const updatedCheckpoints = checkpoints.map(cp =>
      cp.id === checkpointId ? { ...cp, completed: !cp.completed } : cp
    );
    setCheckpoints(updatedCheckpoints);

    const updatedMilestones = roadmapData.milestones.map(milestone => {
      const milestoneCheckpoints = updatedCheckpoints.filter(cp => cp.id.startsWith(milestone.title.split(' ')[0].toLowerCase()));
      const completedCount = milestoneCheckpoints.filter(cp => cp.completed).length;
      const progress = Math.round((completedCount / milestoneCheckpoints.length) * 100);

      return {
        ...milestone,
        progress,
        checkpoints: milestone.checkpoints.map(cp => {
          const updated = updatedCheckpoints.find(uc => uc.id === cp.id);
          return updated || cp;
        }),
      };
    });

    setRoadmapData({ ...roadmapData, milestones: updatedMilestones });

    const updatedMarkedDates = { ...markedDates };
    updatedCheckpoints.forEach(checkpoint => {
      updatedMarkedDates[checkpoint.date] = {
        ...updatedMarkedDates[checkpoint.date],
        dotColor: checkpoint.completed ? '#4CAF50' : '#FF5722',
        customStyles: {
          container: { backgroundColor: checkpoint.completed ? '#E8F5E9' : '#FFF3E0' },
          text: { color: checkpoint.completed ? '#2E7D32' : '#E64A19', fontWeight: 'bold' },
        },
      };
    });
    setMarkedDates(updatedMarkedDates);
  };

  // Calendar day press handler
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    setTaskModal(true);
  };

  // Add task for a specific date
  const addDateTask = () => {
    if (dateTaskText.trim() && selectedDate) {
      const newTaskItem = {
        id: Date.now().toString(),
        text: dateTaskText,
        date: selectedDate,
        completed: false,
      };
      setTasks([...tasks, newTaskItem]);
      setDateTaskText('');
      setTaskModal(false);

      setMarkedDates(prev => ({
        ...prev,
        [selectedDate]: {
          ...prev[selectedDate],
          dots: [...(prev[selectedDate]?.dots || []), { key: 'task', color: '#3F51B5' }],
          marked: true,
        },
      }));
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Add a new task
  const addTask = () => {
    if (newTask.trim()) {
      const today = new Date().toISOString().split('T')[0];
      setTasks([...tasks, {
        id: Date.now().toString(),
        text: newTask,
        date: today,
        completed: false,
      }]);
      setNewTask('');
    }
  };

  // Open video modal
  const openVideo = (video) => {
    setCurrentVideo(video);
    setVideoModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loaderText}>Processing your resume and generating roadmap...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Empowerment Roadmap</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'upload' && styles.activeTab]} onPress={() => setActiveTab('upload')}>
          <Text style={[styles.tabText, activeTab === 'upload' && styles.activeTabText]}>Upload Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'roadmap' && styles.activeTab]} onPress={() => setActiveTab('roadmap')}>
          <Text style={[styles.tabText, activeTab === 'roadmap' && styles.activeTabText]}>Roadmap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'calendar' && styles.activeTab]} onPress={() => setActiveTab('calendar')}>
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'analytics' && styles.activeTab]} onPress={() => setActiveTab('analytics')}>
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'tasks' && styles.activeTab]} onPress={() => setActiveTab('tasks')}>
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'upload' && (
          <View style={styles.uploadContainer}>
            <Text style={styles.sectionTitle}>Upload Your Resume</Text>
            <Text style={styles.sectionDescription}>
              Upload your resume to generate a personalized empowerment roadmap based on your skills and experience.
            </Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickResume}>
              <Text style={styles.uploadButtonText}>Select Resume (PDF/DOC)</Text>
            </TouchableOpacity>
            {resumeFile && (
              <Text style={styles.uploadedFileText}>Selected: {resumeFile.name}</Text>
            )}
          </View>
        )}

        {activeTab === 'roadmap' && roadmapData && (
          <View style={styles.roadmapContainer}>
            <Text style={styles.roadmapTitle}>{roadmapData.title}</Text>
            <Text style={styles.roadmapOverview}>{roadmapData.overview}</Text>
            {roadmapData.milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestone}>
                <View style={styles.milestoneHeader}>
                  <View style={styles.milestoneNumber}>
                    <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.milestoneTitleContainer}>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={styles.milestoneDateRange}>
                      {milestone.startDate} to {milestone.endDate}
                    </Text>
                  </View>
                </View>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>{milestone.progress}% Complete</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${milestone.progress}%` }]} />
                  </View>
                </View>
                <View style={styles.checkpointsContainer}>
                  <Text style={styles.checkpointsTitle}>Checkpoints:</Text>
                  {milestone.checkpoints.map(checkpoint => (
                    <TouchableOpacity
                      key={checkpoint.id}
                      style={styles.checkpointItem}
                      onPress={() => toggleCheckpointCompletion(checkpoint.id)}
                    >
                      <View style={[
                        styles.checkpointMarker,
                        checkpoint.completed && styles.checkpointMarkerCompleted,
                      ]}>
                        {checkpoint.completed && <Text style={styles.checkpointMarkerText}>✓</Text>}
                      </View>
                      <View style={styles.checkpointDetails}>
                        <Text style={styles.checkpointTitle}>{checkpoint.title}</Text>
                        <Text style={styles.checkpointDate}>Due: {checkpoint.date}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.resourcesContainer}>
                  <Text style={styles.resourcesTitle}>Learning Resources:</Text>
                  {milestone.resources.map((resource, resourceIndex) => (
                    <View key={resourceIndex} style={styles.resourceItem}>
                      {resource.type === 'video' && (
                        <TouchableOpacity style={styles.videoResource} onPress={() => openVideo(resource)}>
                          <Text style={styles.resourceIconText}>📺</Text>
                          <Text style={styles.resourceTitle}>{resource.title}</Text>
                        </TouchableOpacity>
                      )}
                      {resource.type === 'article' && (
                        <View style={styles.articleResource}>
                          <Text style={styles.resourceIconText}>📄</Text>
                          <Text style={styles.resourceTitle}>{resource.title}</Text>
                        </View>
                      )}
                      {resource.type === 'practice' && (
                        <View style={styles.practiceResource}>
                          <Text style={styles.resourceIconText}>✏️</Text>
                          <Text style={styles.resourceTitle}>{resource.title}</Text>
                          <Text style={styles.resourceDescription}>{resource.description}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
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
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#4CAF50',
                selectedDayBackgroundColor: '#4CAF50',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4CAF50',
                dayTextColor: '#333333',
                textDisabledColor: '#d9e1e8',
                dotColor: '#4CAF50',
                selectedDotColor: '#ffffff',
                arrowColor: '#4CAF50',
                monthTextColor: '#333333',
              }}
            />
            <View style={styles.upcomingContainer}>
              <Text style={styles.upcomingTitle}>Upcoming Milestones</Text>
              {checkpoints.filter(cp => !cp.completed).slice(0, 5).map(checkpoint => (
                <View key={checkpoint.id} style={styles.upcomingItem}>
                  <View style={styles.upcomingDateCircle}>
                    <Text style={styles.upcomingDateText}>{checkpoint.date.split('-')[2]}</Text>
                    <Text style={styles.upcomingMonthText}>
                      {new Date(checkpoint.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.upcomingDetails}>
                    <Text style={styles.upcomingItemTitle}>{checkpoint.title}</Text>
                    <Text style={styles.upcomingItemDescription}>From: {checkpoint.milestoneTitle}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.upcomingCompleteButton}
                    onPress={() => toggleCheckpointCompletion(checkpoint.id)}
                  >
                    <Text style={styles.upcomingCompleteButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

{activeTab === 'analytics' && (
  <View style={styles.analyticsContainer}>
    <Text style={styles.sectionTitle}>Learning Analytics</Text>
    <Text style={styles.sectionDescription}>Track your progress and skill development.</Text>
    
    {/* Learning Progress Chart */}
    {progressData.length > 0 && progressData.every(d => typeof d.progress === 'number') ? (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Learning Progress</Text>
        <LineChart
          data={{
            labels: progressData.map(d => d.day),
            datasets: [{ data: progressData.map(d => d.progress) }],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#f5f5f5',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '5', strokeWidth: '2', stroke: '#4CAF50' },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>
    ) : (
      <Text style={styles.chartErrorText}>No valid progress data available</Text>
    )}

    {/* Skill Proficiency Chart */}
    {skillsChartData.labels && skillsChartData.labels.length > 0 && skillsChartData.datasets[0].data.every(d => typeof d === 'number') ? (
      <View style={styles.skillsChartContainer}>
        <Text style={styles.chartTitle}>Skill Proficiency</Text>
        <LineChart
          data={skillsChartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#f5f5f5',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>
    ) : (
      <Text style={styles.chartErrorText}>No valid skills data available</Text>
    )}
  </View>
)}

        {activeTab === 'tasks' && (
          <View style={styles.tasksContainer}>
            <Text style={styles.sectionTitle}>Learning Tasks</Text>
            <Text style={styles.sectionDescription}>Manage your learning to-do list.</Text>
            <View style={styles.addTaskContainer}>
              <TextInput
                style={styles.addTaskInput}
                value={newTask}
                onChangeText={setNewTask}
                placeholder="Add a new task..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.addTaskButton} onPress={addTask}>
                <Text style={styles.addTaskButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={tasks}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.taskItem} onPress={() => toggleTaskCompletion(item.id)}>
                  <View style={[styles.taskCheckbox, item.completed && styles.taskCheckboxCompleted]}>
                    {item.completed && <Text style={styles.taskCheckboxText}>✓</Text>}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                      {item.text}
                    </Text>
                    <Text style={styles.taskDate}>Due: {item.date}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListHeaderComponent={<Text style={styles.taskListTitle}>Your Tasks:</Text>}
            />
          </View>
        )}
      </ScrollView>

      <Modal visible={videoModal} transparent={true} animationType="slide" onRequestClose={() => setVideoModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.videoModalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setVideoModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {currentVideo && (
              <>
                <Text style={styles.videoTitle}>{currentVideo.title}</Text>
                <WebView style={styles.webView} javaScriptEnabled={true} source={{ uri: currentVideo.url }} />
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={taskModal} transparent={true} animationType="slide" onRequestClose={() => setTaskModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.taskModalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setTaskModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Task for {selectedDate}</Text>
            <TextInput
              style={styles.modalInput}
              value={dateTaskText}
              onChangeText={setDateTaskText}
              placeholder="Enter task description..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity style={styles.modalButton} onPress={addDateTask}>
              <Text style={styles.modalButtonText}>Add Task</Text>
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
    backgroundColor: '#FFFFFF', // White background
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
    color: '#D81B60', // Deep pink for text
    textAlign: 'center',
    fontFamily: 'Arial', // Placeholder; consider a feminine font
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8BBD0', // Light pink border
    backgroundColor: '#FFFFFF', // White header
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#EC407A', // Vibrant pink for back button
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 30,
    color: '#C2185B', // Darker pink for title
    fontFamily: 'Arial',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8BBD0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F06292', // Bright pink for active tab
  },
  tabText: {
    fontSize: 14,
    color: '#F48FB1', // Muted pink for inactive tabs
  },
  activeTabText: {
    color: '#EC407A', // Vibrant pink for active tab text
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  uploadContainer: {
    padding: 15,
  },
  uploadButton: {
    backgroundColor: '#F06292', // Bright pink button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  uploadedFileText: {
    fontSize: 14,
    color: '#D81B60',
    marginTop: 10,
    textAlign: 'center',
  },
  roadmapContainer: {
    padding: 15,
  },
  roadmapTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 10,
    fontFamily: 'Arial',
  },
  roadmapOverview: {
    fontSize: 16,
    color: '#F48FB1', // Softer pink for description
    marginBottom: 20,
  },
  milestone: {
    backgroundColor: '#FFFFFF', // White milestone background
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  milestoneNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F06292', // Bright pink milestone number
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  milestoneNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  milestoneTitleContainer: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  milestoneDateRange: {
    fontSize: 14,
    color: '#F48FB1',
  },
  milestoneDescription: {
    fontSize: 16,
    color: '#F06292',
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#F48FB1',
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F8BBD0', // Light pink background
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC407A', // Vibrant pink fill
  },
  checkpointsContainer: {
    marginBottom: 15,
  },
  checkpointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 10,
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkpointMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F06292',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkpointMarkerCompleted: {
    backgroundColor: '#F06292',
  },
  checkpointMarkerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkpointDetails: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: 16,
    color: '#D81B60',
  },
  checkpointDate: {
    fontSize: 14,
    color: '#F48FB1',
  },
  resourcesContainer: {
    marginTop: 5,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 10,
  },
  resourceItem: {
    marginBottom: 10,
  },
  videoResource: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White resource background
    padding: 10,
    borderRadius: 8,
  },
  articleResource: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
  },
  practiceResource: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
  },
  resourceIconText: {
    fontSize: 18,
    marginRight: 10,
  },
  resourceTitle: {
    fontSize: 16,
    color: '#D81B60',
    flex: 1,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#F48FB1',
    marginTop: 5,
    marginLeft: 28,
  },
  calendarContainer: {
    padding: 15,
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 10,
    fontFamily: 'Arial',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#F48FB1',
    marginBottom: 20,
  },
  upcomingContainer: {
    marginTop: 20,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 15,
  },
  upcomingItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // White upcoming item background
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  upcomingDateCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F06292',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  upcomingDateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  upcomingMonthText: {
    color: '#fff',
    fontSize: 12,
  },
  upcomingDetails: {
    flex: 1,
  },
  upcomingItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  upcomingItemDescription: {
    fontSize: 14,
    color: '#F48FB1',
  },
  upcomingCompleteButton: {
    backgroundColor: '#EC407A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  upcomingCompleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  analyticsContainer: {
    padding: 15,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF', // White chart background
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 15,
  },
  skillsChartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
  },
  tasksContainer: {
    padding: 15,
    flex: 1,
  },
  addTaskContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  addTaskInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F8BBD0',
    padding: 10,
    fontSize: 16,
    marginRight: 10,
  },
  addTaskButton: {
    backgroundColor: '#F06292',
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  addTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F06292',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#F06292',
  },
  taskCheckboxText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#D81B60',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#F48FB1',
  },
  taskDate: {
    fontSize: 14,
    color: '#F48FB1',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF', // White modal background
    borderRadius: 15,
    padding: 20,
    height: '70%',
  },
  taskModalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#D81B60',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginVertical: 10,
  },
  webView: {
    flex: 1,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginVertical: 15,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  modalButton: {
    backgroundColor: '#F06292',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});