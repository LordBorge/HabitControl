import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Habit, HabitCompletion, HabitWithStatus, RepeatType } from '@/types/habit';
import { format, isToday, parseISO, isAfter, startOfDay, isSameDay, differenceInDays, getDay, getDate, addDays, isBefore } from 'date-fns';
import { pt } from 'date-fns/locale';

interface HabitContextProps {
  habits: Habit[];
  completions: HabitCompletion[];
  getTodayHabits: () => HabitWithStatus[];
  getHabitsForDate: (date: Date) => HabitWithStatus[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date: Date, completed: boolean) => Promise<void>;
  getHabitCompletionRate: (habitId: string) => number;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  loading: boolean;
}

const HabitContext = createContext<HabitContextProps | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Load data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const habitsData = await AsyncStorage.getItem('@habits');
        const completionsData = await AsyncStorage.getItem('@completions');
        
        if (habitsData) {
          const parsedHabits = JSON.parse(habitsData);
          console.log('Loaded habits:', parsedHabits); // Debug log
          setHabits(parsedHabits);
        }
        
        if (completionsData) {
          const parsedCompletions = JSON.parse(completionsData);
          console.log('Loaded completions:', parsedCompletions); // Debug log
          setCompletions(parsedCompletions);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save habits to AsyncStorage whenever they change
  useEffect(() => {
    const saveHabits = async () => {
      try {
        const habitsJson = JSON.stringify(habits);
        console.log('Saving habits:', habitsJson); // Debug log
        await AsyncStorage.setItem('@habits', habitsJson);
      } catch (error) {
        console.error('Error saving habits:', error);
      }
    };

    if (!loading) {
      saveHabits();
    }
  }, [habits, loading]);

  // Save completions to AsyncStorage whenever they change
  useEffect(() => {
    const saveCompletions = async () => {
      try {
        const completionsJson = JSON.stringify(completions);
        console.log('Saving completions:', completionsJson); // Debug log
        await AsyncStorage.setItem('@completions', completionsJson);
      } catch (error) {
        console.error('Error saving completions:', error);
      }
    };

    if (!loading) {
      saveCompletions();
    }
  }, [completions, loading]);

  // Check if a habit should be scheduled for a specific date
  const shouldScheduleHabit = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = getDay(date);
    const dayOfMonth = getDate(date);
    
    switch (habit.repeatType) {
      case 'daily':
        return true;
      case 'weekly':
        return habit.repeatDays?.includes(dayOfWeek) || false;
      case 'monthly':
        return habit.repeatDates?.includes(dayOfMonth) || false;
      default:
        return false;
    }
  };

  // Get habits for today
  const getTodayHabits = (): HabitWithStatus[] => {
    return getHabitsForDate(new Date());
  };

  // Get habits for a specific date
  const getHabitsForDate = (date: Date): HabitWithStatus[] => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    return habits
      .filter(habit => shouldScheduleHabit(habit, date))
      .map(habit => {
        const completion = completions.find(
          c => c.habitId === habit.id && c.date === formattedDate
        );
        
        return {
          ...habit,
          isCompleted: completion?.completed || false,
          completionId: completion?.id,
          isScheduledForToday: true
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Add a new habit
  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const now = new Date();
      const newHabit: Habit = {
        id: uuidv4(),
        ...habitData,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      console.log('Adding new habit:', newHabit); // Debug log
      
      setHabits(prevHabits => {
        const updatedHabits = [...prevHabits, newHabit];
        console.log('Updated habits array:', updatedHabits); // Debug log
        return updatedHabits;
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  };

  // Update an existing habit
  const updateHabit = async (updatedHabit: Habit): Promise<void> => {
    try {
      updatedHabit.updatedAt = new Date().toISOString();
      
      setHabits(prevHabits => 
        prevHabits.map(habit => 
          habit.id === updatedHabit.id ? updatedHabit : habit
        )
      );
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  };

  // Delete a habit
  const deleteHabit = async (id: string): Promise<void> => {
    try {
      setHabits(prevHabits => prevHabits.filter(habit => habit.id !== id));
      setCompletions(prevCompletions => 
        prevCompletions.filter(completion => completion.habitId !== id)
      );
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  };

  // Toggle habit completion status
  const toggleHabitCompletion = async (habitId: string, date: Date, completed: boolean): Promise<void> => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const existingCompletion = completions.find(
        c => c.habitId === habitId && c.date === formattedDate
      );
      
      if (existingCompletion) {
        setCompletions(prevCompletions => 
          prevCompletions.map(completion => 
            completion.id === existingCompletion.id
              ? { ...completion, completed, completedAt: new Date().toISOString() }
              : completion
          )
        );
      } else {
        const newCompletion: HabitCompletion = {
          id: uuidv4(),
          habitId,
          date: formattedDate,
          completed,
          completedAt: new Date().toISOString()
        };
        
        setCompletions(prevCompletions => [...prevCompletions, newCompletion]);
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      throw error;
    }
  };

  // Calculate completion rate for a habit
  const getHabitCompletionRate = (habitId: string): number => {
    const habitCompletions = completions.filter(c => c.habitId === habitId);
    
    if (habitCompletions.length === 0) {
      return 0;
    }
    
    const completedCount = habitCompletions.filter(c => c.completed).length;
    return (completedCount / habitCompletions.length) * 100;
  };

  const contextValue: HabitContextProps = {
    habits,
    completions,
    getTodayHabits,
    getHabitsForDate,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getHabitCompletionRate,
    selectedDate,
    setSelectedDate,
    loading
  };

  return (
    <HabitContext.Provider value={contextValue}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};