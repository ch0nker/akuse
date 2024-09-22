import 'react-activity/dist/Dots.css';

import {
  faDisplay,
  faFilter,
  faHeading,
  faLeaf,
  faMasksTheater,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useEffect, useState } from 'react';
import Dots from 'react-activity/dist/Dots';

import { FORMATS, GENRES, SEASONS, SORTS } from '../../constants/anilist';
import { searchFilteredAnime } from '../../modules/anilist/anilistApi';
import { animeDataToListAnimeData } from '../../modules/utils';
import { ListAnimeData } from '../../types/anilistAPITypes';
import { ViewerIdContext } from '../App';
import AnimeEntry from '../components/AnimeEntry';
import Heading from '../components/Heading';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { PageInfo } from '../../types/anilistGraphQLTypes';


const Tab3: React.FC = () => {
  const viewerId = useContext(ViewerIdContext);

  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [lastUpdate, setLastUpdate] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);

  const [searchedAnime, setSearchedAnime] = useState<
    ListAnimeData[] | undefined
  >([]);

  const handleTitleChange = (event: any) => {
    setSelectedTitle(event.target.value);
  };

  const handleGenreChange = (event: any) => {
    setSelectedGenre(event.target.value);
  };

  const handleSeasonChange = (event: any) => {
    setSelectedSeason(event.target.value);
  };

  const handleYearChange = (event: any) => {
    setSelectedYear(event.target.value);
  };

  const handleFormatChange = (event: any) => {
    setSelectedFormat(event.target.value);
  };

  const handleSortChange = (event: any) => {
    setSelectedSort(event.target.value);
  };

  const handleClearClick = () => {
    setSelectedTitle('');
    setSelectedGenre('');
    setSelectedSeason('');
    setSelectedYear('');
    setSelectedFormat('');
    setSelectedSort('');
  };

  const getArgs = () => {
    let title = '';
    let genre = '';
    let season = '';
    let year = '';
    let format = '';
    let sort = '';

    let args = [
      selectedTitle !== ''
        ? (title = `search: "${selectedTitle}"`)
        : (title = ''),
      selectedGenre !== ''
        ? (genre = `genre: "${selectedGenre}"`)
        : (genre = ''),
      selectedSeason !== ''
        ? (season = `season: ${selectedSeason}`)
        : (season = ''),
      selectedYear !== ''
        ? (year = `seasonYear: ${selectedYear}`)
        : (year = ''),
      selectedFormat !== ''
        ? (format = `format: ${selectedFormat}`)
        : (format = ''),
      selectedSort !== '' ? (sort = `sort: ${selectedSort}`) : (sort = ''),
    ].filter((item) => !(item == ''));

    return args.concat('type: ANIME').join(', ');
  }

  const getSearchAnime = async (newSearch: boolean = false) => {
    if(!hasNextPage && (page > 1 || !newSearch)) return searchedAnime;

    const result = newSearch ? [] : searchedAnime;

    const anime = await searchFilteredAnime(getArgs(), viewerId, page);
    const pageInfo = anime.pageInfo as PageInfo;

    setHasNextPage(pageInfo.hasNextPage);
    if(pageInfo.hasNextPage)
      setPage(page + 1);

    return result?.concat(animeDataToListAnimeData(anime));
  }

  const handleSearchClick = async () => {
    setSearchedAnime([]);

    setPage(1);
    setHasNextPage(false);

    setSearchedAnime(
      await getSearchAnime(true)
    );
  };

  const handleInputKeydown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.keyCode === 229) return;

    if (event.code === 'Enter') handleSearchClick();
  };

  const handleScroll = async (event: any) => {
    const target: HTMLDivElement = event.target;
    const position = target.scrollTop;
    const height = target.scrollHeight - target.offsetHeight;
    const current = Date.now() / 1000;
    const bottomOffset = Math.floor(height - position)

    console.log(bottomOffset);

    if(bottomOffset > 1 || current - lastUpdate < 1)
      return;

    setLastUpdate(lastUpdate);

    setSearchedAnime(
      await getSearchAnime(),
    );
  };

  return (
    <div className="body-container  show-tab" onScroll={handleScroll}>
      <div className="main-container">
        <Heading text="Search" />
        <main className="search">
          <div className="filters-container" onKeyDown={handleInputKeydown}>
            <div className="filter">
              <h2>
                <FontAwesomeIcon className="i" icon={faHeading} /> Title
              </h2>
              <input
                type="text"
                id="search-page-filter-title"
                placeholder="Search..."
                value={selectedTitle}
                onChange={handleTitleChange}
              />
            </div>
            <div className={`filter ${selectedGenre === '' ? '' : 'active'}`}>
              <h2>
                <FontAwesomeIcon className="i" icon={faMasksTheater} /> Genre
              </h2>
              <select
                id="search-page-filter-genre"
                value={selectedGenre}
                onChange={handleGenreChange}
                className={selectedGenre === '' ? '' : 'active'}
              >
                {GENRES.map((genre) => (
                  <option key={genre.value} value={genre.value ?? ''}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`filter ${selectedSeason === '' ? '' : 'active'}`}>
              <h2>
                <FontAwesomeIcon className="i" icon={faLeaf} /> Season
              </h2>
              <div className="filter-divisor">
                <select
                  id="search-page-filter-season"
                  value={selectedSeason}
                  onChange={handleSeasonChange}
                  className={selectedSeason === '' ? '' : 'active'}
                >
                  {SEASONS.map((season) => (
                    <option key={season.value} value={season.value ?? ''}>
                      {season.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  id="search-page-filter-year"
                  placeholder="Year"
                  value={selectedYear}
                  onChange={handleYearChange}
                />
              </div>
            </div>
            <div className={`filter ${selectedFormat === '' ? '' : 'active'}`}>
              <h2>
                <FontAwesomeIcon className="i" icon={faDisplay} /> Format
              </h2>
              <select
                id="search-page-filter-format"
                value={selectedFormat}
                onChange={handleFormatChange}
                className={selectedFormat === '' ? '' : 'active'}
              >
                {FORMATS.map((format) => (
                  <option key={format.value} value={format.value ?? ''}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`filter ${selectedSort === '' ? '' : 'active'}`}>
              <h2>
                <FontAwesomeIcon className="i" icon={faFilter} /> Sort
              </h2>
              <select
                id="search-page-filter-sort"
                value={selectedSort}
                onChange={handleSortChange}
                className={selectedSort === '' ? '' : 'active'}
              >
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value ?? ''}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="buttons">
              {/* <div className="filter">
                <button id="search-clear" onClick={handleClearClick}>
                  Clear
                </button>
              </div> */}
              <button id="search-clear" onClick={handleClearClick}>
                <FontAwesomeIcon className="i" icon={faTrashCan} />
              </button>
              <button id="search-submit" onClick={handleSearchClick}>
                Search
              </button>
            </div>
          </div>
          <div className="entries-container">
            {!searchedAnime ? (
              <div className="activity-indicator">
                <Dots />
              </div>
            ) : (
              searchedAnime.map((value, index) => (
                <AnimeEntry key={index} listAnimeData={value} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Tab3;
