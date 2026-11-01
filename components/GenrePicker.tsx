"use client";

import { TopicGenre, REQUIRED_GENRES } from "@/lib/topics";
import styles from "./GenrePicker.module.css";

const GENRE_DETAILS: Record<TopicGenre, { label: string; desc: string }> = {
  "current-affairs": {
    label: "current-affairs",
    desc: "Today's world news and global developments",
  },
  technology: {
    label: "technology",
    desc: "AI, computing, software, and future tech",
  },
  "society-culture": {
    label: "society-culture",
    desc: "Cultural traditions, community, and social habits",
  },
  "personal-stories": {
    label: "personal-stories",
    desc: "Personal experiences, mistakes, and reflections",
  },
  debate: {
    label: "debate",
    desc: "Controversial civic, philosophical, and social issues",
  },
  "career-education": {
    label: "career-education",
    desc: "Professional growth, skills, and workplace decisions",
  },
  "health-sports-lifestyle": {
    label: "health-sports-lifestyle",
    desc: "Physical fitness, mental focus, sports, and routines",
  },
  entertainment: {
    label: "entertainment",
    desc: "Music, cinema, gaming, books, and creative media",
  },
  "ethics-scenarios": {
    label: "ethics-scenarios",
    desc: "Moral dilemmas, whistleblowing, and tough decisions",
  },
  "business-money": {
    label: "business-money",
    desc: "Financial literacy, startups, markets, and economics",
  },
};

interface GenrePickerProps {
  selectedGenres: TopicGenre[];
  onChange: (genres: TopicGenre[]) => void;
  onSubmit: () => void;
}

export default function GenrePicker({ selectedGenres, onChange, onSubmit }: GenrePickerProps) {
  const allSelected = selectedGenres.length === REQUIRED_GENRES.length;

  const handleToggleGenre = (genre: TopicGenre) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...REQUIRED_GENRES]);
    }
  };

  const hasAtLeastOne = selectedGenres.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button
          type="button"
          onClick={handleSelectAllToggle}
          className={styles.selectAllBtn}
          aria-label={allSelected ? "Deselect all genres" : "Select all genres"}
        >
          {allSelected ? "[ deselect all ]" : "[ select all ]"}
        </button>
        <span className={styles.selectedCount}>
          selected: {selectedGenres.length}/{REQUIRED_GENRES.length}
        </span>
      </div>

      <fieldset className={styles.grid}>
        <legend className="sr-only">Choose speaking genres</legend>
        {REQUIRED_GENRES.map((genre) => {
          const isChecked = selectedGenres.includes(genre);
          const detail = GENRE_DETAILS[genre];
          const inputId = `genre-checkbox-${genre}`;

          return (
            <div key={genre} className={styles.checkboxItem}>
              <input
                type="checkbox"
                id={inputId}
                checked={isChecked}
                onChange={() => handleToggleGenre(genre)}
                className={`sr-only ${styles.nativeCheckbox}`}
              />
              <label htmlFor={inputId} className={styles.checkboxLabel}>
                <span aria-hidden="true">{isChecked ? "[x]" : "[ ]"}</span>
                <span>{detail.label}</span>
              </label>
              <span className={styles.genreDesc}>{detail.desc}</span>
            </div>
          );
        })}
      </fieldset>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!hasAtLeastOne}
          className={styles.submitBtn}
          aria-disabled={!hasAtLeastOne}
        >
          [ choose topic ]
        </button>
        {!hasAtLeastOne && (
          <span className={styles.disabledHint} role="status">
            choose at least one genre
          </span>
        )}
      </div>
    </div>
  );
}

