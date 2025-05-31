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
          setHabits(JSON.parse(habitsData));
        }
        
        if (completionsData) {
          setCompletions(JSON.parse(completionsData));
        }
      } catch (error) {
        console.error('Error loading data', error);
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
        await AsyncStorage.setItem('@habits', JSON.stringify(habits));
      } catch (error) {
        console.error('Error saving habits', error);
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
        await AsyncStorage.setItem('@completions', JSON.stringify(completions));
      } catch (error) {
        console.error('Error saving completions', error);
      }
    };

    if (!loading) {
      saveCompletions();
    }
  }, [completions, loading]);

  // Auto-mark habits as not completed if time has passed
  useEffect(() => {
    const checkOverdueHabits = () => {
      const now = new Date();
      const todayHabits = getTodayHabits();
      
      todayHabits.forEach(habit => {
        if (!habit.isCompleted) {
          const [hours, minutes] = habit.time.split(':').map(Number);
          const habitTime = new Date();
          habitTime.setHours(hours, minutes, 0, 0);
          
          if (isAfter(now, habitTime)) {
            // Mark as not completed if time has passed and not already completed
            toggleHabitCompletion(habit.id, now, false);
          }
        }
      });
    };

    const interval = setInterval(checkOverdueHabits, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [habits, completions]);

  // Check if a habit should be scheduled for a specific date
  const shouldScheduleHabit = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = getDay(date); // 0-6, Sunday to Saturday
    const dayOfMonth = getDate(date); // 1-31
    
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
    const now = new Date();
    
    return habits
      .filter(habit => {
        // Check if the habit should be scheduled for this date
        if (!shouldScheduleHabit(habit, date)) {
          return false;
        }
        // Removido o filtro de horário para mostrar todos os hábitos do dia
        return true;
      })
      .map(habit => {
        // Find completion for this habit on this date
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
    const now = new Date();
    const newHabit: Habit = {
      id: uuidv4(),
      ...habitData,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    setHabits(prevHabits => {
      const updatedHabits = [...prevHabits, newHabit];
      AsyncStorage.setItem('@habits', JSON.stringify(updatedHabits)); // Salva imediatamente
      console.log('Hábito salvo:', newHabit);
      return updatedHabits;
    });
  };

  // Update an existing habit
  const updateHabit = async (updatedHabit: Habit): Promise<void> => {
    updatedHabit.updatedAt = new Date().toISOString();
    
    setHabits(prevHabits => 
      prevHabits.map(habit => 
        habit.id === updatedHabit.id ? updatedHabit : habit
      )
    );
  };

  // Delete a habit
  const deleteHabit = async (id: string): Promise<void> => {
    setHabits(prevHabits => prevHabits.filter(habit => habit.id !== id));
    
    // Also remove all completions for this habit
    setCompletions(prevCompletions => 
      prevCompletions.filter(completion => completion.habitId !== id)
    );
  };

  // Toggle habit completion status
  const toggleHabitCompletion = async (habitId: string, date: Date, completed: boolean): Promise<void> => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const existingCompletion = completions.find(
      c => c.habitId === habitId && c.date === formattedDate
    );
    
    if (existingCompletion) {
      // Update existing completion
      setCompletions(prevCompletions => 
        prevCompletions.map(completion => 
          completion.id === existingCompletion.id
            ? { ...completion, completed, completedAt: new Date().toISOString() }
            : completion
        )
      );
    } else {
      // Create new completion
      const newCompletion: HabitCompletion = {
        id: uuidv4(),
        habitId,
        date: formattedDate,
        completed,
        completedAt: new Date().toISOString()
      };
      
      setCompletions(prevCompletions => [...prevCompletions, newCompletion]);
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

  return (
    <HabitContext.Provider
      value={{
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
      }}
    >
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