import React from "react";

// Brouillon du signalement en cours, partagé entre le formulaire
// (report) et la modale d'import d'image (importPic).
interface ReportInterface {
  date: Date;
  setDate: (date: Date) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  type: number | null;
  setType: (type: number | null) => void;
  image: string | null;
  setImage: (image: string | null) => void;
  reset: () => void;
}

const Report = React.createContext<ReportInterface | null>(null);

interface ReportProviderProps {
  children: React.ReactNode;
}

export const ReportProvider = ({ children }: ReportProviderProps) => {
  const [date, setDate] = React.useState(() => new Date());
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<number | null>(null);
  const [image, setImage] = React.useState<string | null>(null);

  const reset = React.useCallback(() => {
    setDate(new Date());
    setTitle("");
    setDescription("");
    setType(null);
    setImage(null);
  }, []);

  return (
    <Report.Provider
      value={{
        date,
        setDate,
        title,
        setTitle,
        description,
        setDescription,
        type,
        setType,
        image,
        setImage,
        reset,
      }}
    >
      {children}
    </Report.Provider>
  );
};

export const useReport = () => {
  const context = React.useContext(Report);

  if (!context)
    throw new Error("useReport must be used within a ReportProvider.");

  return context;
};
