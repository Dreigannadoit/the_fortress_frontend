import { useMemo } from 'react';

const useMinutesToMilliseconds = (minutes) => {
  const milliseconds = useMemo(() => {
    return minutes * 60 * 1000;
  }, [minutes]);

  return milliseconds;
};

export default useMinutesToMilliseconds;
