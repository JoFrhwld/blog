from commonmeta import encode_doi
from pathlib import Path
import yaml
import logging
import subprocess

def get_all_posts(post_base:str = "posts")->list[Path]:
  """Get all post directories

  Args:
      post_base (str, optional): 
        base post path. Defaults to "posts".

  Returns:
      list[Path]: Path to every post
  """
  post_dirs = [
    post
    for year in Path(post_base).glob("*/")
    for month in year.glob("*/")
    for post in month.glob("*/")
  ]
  return post_dirs

def make_metadata(path:Path) -> None:
  """Create empty `_metadata.yml` file.

  Args:
      path (Path): Path to post
  """
  metadata_path = path.joinpath("_metadata.yml")
  if metadata_path.exists():
    return
  else:
    metadata_path.touch()

def make_all_metadata(paths:list[Path]) -> None:
  """Make all `_metadata.yml`

  Args:
      paths (list[Path]): 
        List of all post paths
  """
  for p in paths:
    make_metadata(p)
    
def make_date(path:Path)->str:
  """Return a date string based on the path name

  Args:
      path (Path): Path to post

  Returns:
      (str): Date string
  """
  return path.name.split("_")[0]

def make_doi() -> str:
  """Make doi number

    Returns:
      (str): doi
  """
  doi_url = encode_doi("10.59350")
  doi_number = doi_url.removeprefix("https://doi.org/")
  return doi_number
    
def check_metadata(path:Path)->None:
  """Check and update a `_metadata.yml` file

  Args:
      path (Path): Path to post
  """
  metadata_path = path.joinpath("_metadata.yml")
  dat = yaml.safe_load(metadata_path.read_text())

  if dat is None:
    dat = {
      "date": make_date(path),
      "doi": make_doi()
    }
    metadata_path.write_text(
      yaml.dump(dat)
    )
    return
  
  # just to be safe
  if not isinstance(dat, dict):
    logging.warning(f"Non-dict _metadata for {str(path)}")
    return
  
  # avoid writing if not necessary
  if "date" in dat \
    and "doi" in dat \
    and dat["date"] == make_date(path):

    return
  
  if not "doi" in dat:
    dat["doi"] = make_doi()

  if not "date" in dat:
    dat["date"] = make_date(path)
  elif dat["date"] != make_date(path):
    dat["date"] = make_date(path)
   
  metadata_path.write_text(
      yaml.dump(dat)
  )

def check_all_metadata(paths: list[Path]) -> None:
  """Check and update all `_metadata.yml` files

  Args:
      paths (list[Path]): _description_
  """
  for p in paths:
    check_metadata(p)
  
post_dirs = get_all_posts("posts")
make_all_metadata(post_dirs)
check_all_metadata(post_dirs)
subprocess.call("make")