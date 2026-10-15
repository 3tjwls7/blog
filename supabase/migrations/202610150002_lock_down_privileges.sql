revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

revoke truncate, trigger, references on
  public.profiles,
  public.posts,
  public.follows,
  public.likes,
  public.comments
from anon, authenticated;

revoke insert, update, delete on
  public.profiles,
  public.posts,
  public.follows,
  public.likes,
  public.comments
from anon;
