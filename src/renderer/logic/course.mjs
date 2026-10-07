// Lesson/question state machine ported from the prototype's app.js, made pure.
// State is a plain object with arrays so it can be saved and restored directly.
// Feedback wording preserves the prototype's phrasing.

export function createCourse(lessons) {
  const total = lessons.length;
  const lessonIndexById = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  const questionIds = new Set(lessons.flatMap((lesson) => lesson.questions.map((q) => q.id)));

  function initialState() {
    return { lessonIndex: 0, questionIndex: 0, answered: [], completedLessons: [], missedLessons: [] };
  }

  function current(state) {
    const lesson = lessons[state.lessonIndex];
    const question = lesson.questions[state.questionIndex];
    return {
      lesson,
      question,
      questionId: question.id,
      isAnswered: state.answered.includes(question.id),
      isLastQuestion: state.questionIndex === lesson.questions.length - 1,
      isLastLesson: state.lessonIndex === total - 1,
    };
  }

  function canAdvance(state) {
    return current(state).isAnswered;
  }

  function answer(state, choice) {
    const { lesson, question, questionId, isAnswered } = current(state);
    if (!Number.isInteger(choice) || choice < 0 || choice >= question.options.length) {
      throw new RangeError('Invalid answer');
    }
    const rightFeedback = `That’s right. ${question.why}`;
    if (isAnswered) return { state, correct: true, alreadyAnswered: true, feedback: rightFeedback };
    if (choice === question.correct) {
      return {
        state: { ...state, answered: [...state.answered, questionId] },
        correct: true,
        alreadyAnswered: false,
        feedback: rightFeedback,
      };
    }
    const missedLessons = state.missedLessons.includes(lesson.id)
      ? state.missedLessons
      : [...state.missedLessons, lesson.id];
    return {
      state: { ...state, missedLessons },
      correct: false,
      alreadyAnswered: false,
      feedback: `Not quite. ${question.hints[choice]} Try again, or open “Explain it more simply.”`,
    };
  }

  function next(state) {
    if (!canAdvance(state)) return { state, event: 'blocked' };
    const { lesson, isLastQuestion, isLastLesson } = current(state);
    if (!isLastQuestion) {
      return { state: { ...state, questionIndex: state.questionIndex + 1 }, event: 'next-question' };
    }
    const completedLessons = state.completedLessons.includes(lesson.id)
      ? state.completedLessons
      : [...state.completedLessons, lesson.id];
    if (isLastLesson) return { state: { ...state, completedLessons }, event: 'checkpoint' };
    return {
      state: { ...state, completedLessons, lessonIndex: state.lessonIndex + 1, questionIndex: 0 },
      event: 'next-lesson',
    };
  }

  function open(state, lessonIndex) {
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex >= total) {
      throw new RangeError('Invalid lesson');
    }
    return { ...state, lessonIndex, questionIndex: 0 };
  }

  function checkpoint(state) {
    const missingLessonIds = lessons
      .filter((lesson) => !state.completedLessons.includes(lesson.id))
      .map((lesson) => lesson.id);
    return {
      completedCount: state.completedLessons.length,
      total,
      missingLessonIds,
      missedLessonIds: [...state.missedLessons],
    };
  }

  function fromSaved(saved = {}) {
    const lessonIndex = lessonIndexById.get(saved.lessonId) ?? 0;
    const questionCount = lessons[lessonIndex].questions.length;
    const questionIndex =
      Number.isInteger(saved.questionIndex) && saved.questionIndex >= 0 && saved.questionIndex < questionCount
        ? saved.questionIndex
        : 0;
    const known = (list, ids) => (Array.isArray(list) ? list.filter((id) => ids.has(id)) : []);
    return {
      lessonIndex,
      questionIndex,
      answered: known(saved.answered, questionIds),
      completedLessons: known(saved.completedLessons, lessonIndexById),
      missedLessons: known(saved.missedLessons, lessonIndexById),
    };
  }

  return { lessons, initialState, current, canAdvance, answer, next, open, checkpoint, fromSaved };
}
