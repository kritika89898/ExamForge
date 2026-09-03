"""Split the verified IGDTUW CSE-AI Semester 5 2025 source collection."""

from pathlib import Path
import sys

from pypdf import PdfReader, PdfWriter


PAPERS = (
    {
        "filename": "BCS303_TOC_MID_2025.pdf",
        "pages": (1,),
        "title": "Theory of Computation - Mid Semester 2025",
        "subject": "BCS 303",
    },
    {
        "filename": "BCS303_TOC_END_2025.pdf",
        "pages": (7, 8),
        "title": "Theory of Computation - End Semester 2025",
        "subject": "BCS 303",
    },
    {
        "filename": "BAI305_DL1_MID_2025.pdf",
        "pages": (2,),
        "title": "Deep Learning-I - Mid Semester 2025",
        "subject": "BAI 305",
    },
    {
        "filename": "BAI305_DL1_END_2025.pdf",
        "pages": (9, 10),
        "title": "Deep Learning-I - End Semester 2025",
        "subject": "BAI 305",
    },
    {
        "filename": "BAI303_CS_END_2025.pdf",
        "pages": (11, 12),
        "title": "Cyber Security - End Semester 2025",
        "subject": "BAI 303",
    },
    {
        "filename": "HMC301_PEHV_MID_2025.pdf",
        "pages": (4,),
        "title": "Professional Ethics and Human Values - Mid Semester 2025",
        "subject": "HMC 301",
    },
    {
        "filename": "HMC301_PEHV_END_2025.pdf",
        "pages": (15,),
        "title": "Professional Ethics and Human Values - End Semester 2025",
        "subject": "HMC 301",
    },
    {
        "filename": "BAI301_ML_MID_2025.pdf",
        "pages": (5, 6),
        "title": "Machine Learning - Mid Semester 2025",
        "subject": "BAI 301",
    },
    {
        "filename": "BAI301_ML_END_2025.pdf",
        "pages": (13, 14),
        "title": "Machine Learning - End Semester 2025",
        "subject": "BAI 301",
    },
)


def split_collection(source_path: Path, output_dir: Path) -> None:
    if not source_path.is_file():
        raise FileNotFoundError(f"Source PDF not found: {source_path}")

    reader = PdfReader(source_path)
    if len(reader.pages) != 15:
        raise ValueError(f"Expected 15 source pages, found {len(reader.pages)}")

    output_dir.mkdir(parents=True, exist_ok=True)

    for paper in PAPERS:
        writer = PdfWriter()
        for page_number in paper["pages"]:
            writer.add_page(reader.pages[page_number - 1])

        writer.add_metadata(
            {
                "/Title": paper["title"],
                "/Subject": paper["subject"],
                "/Creator": "ExamForge",
            }
        )

        output_path = output_dir / paper["filename"]
        with output_path.open("wb") as output_stream:
            writer.write(output_stream)

        # Reopen every output immediately to catch incomplete writes.
        written = PdfReader(output_path)
        if len(written.pages) != len(paper["pages"]):
            raise ValueError(f"Page-count verification failed: {output_path}")

        print(
            f"Created {output_path.name}: "
            f"source pages {paper['pages']}, {output_path.stat().st_size} bytes"
        )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: split-2025-papers.py <source-pdf> <output-directory>")

    split_collection(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
